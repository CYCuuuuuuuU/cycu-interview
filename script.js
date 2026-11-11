const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTikTWQ1NHtmCIoslCCUnqJ_b-UOvFNnF2jkTFRYLthASVeGCZJOZDD5d9gZoy4X3zeQLhb-yHF2CRB/pub?output=csv';     // google sheet

let structure = {};
let selectedValues = { college: '', dept: '', path: '', year: '' };
let currentDataList = [];     // 當前符合條件的所有筆數
let currentIndex = 0;     // 當前顯示第幾筆

Papa.parse(csvUrl, {
    download: true, header: true, skipEmptyLines: true,
    complete: function(results) {
        buildStructure(results.data);
        initDropdowns();
    }
});

function buildStructure(data) {
    structure = {};
    data.forEach(row => {
        const colFull = row['面試學院']?.trim();
        if (!colFull) return;

        const pureCol = colFull.split('（')[0].trim();
        let deptKey = Object.keys(row).find(k => k.includes(pureCol) && k !== '面試學院');
        let dept = row[deptKey]?.trim();

        const path = row['面試管道']?.trim();
        const yr = row['面試學年度']?.trim();

        if (dept) {
            if (!structure[colFull]) structure[colFull] = {};
            if (!structure[colFull][dept]) structure[colFull][dept] = {};
            if (!structure[colFull][dept][path]) structure[colFull][dept][path] = {};
            if (!structure[colFull][dept][path][yr]) structure[colFull][dept][path][yr] = [];
            structure[colFull][dept][path][yr].push(row);
        }
    });
}

function initDropdowns() {
    const colleges = Object.keys(structure).sort();
    const box1 = document.getElementById('box-college');
    const text1 = document.getElementById('text-college');
    const opt1 = document.getElementById('options-college');

    text1.innerText = '-- 選擇學院 --';
    box1.classList.remove('disabled');

    opt1.innerHTML = '';
    colleges.forEach(c => {
        const item = document.createElement('div');
        item.className = 'dropdown-option-item';
        item.innerText = c;
        item.onclick = () => selectOption('college', c);
        opt1.appendChild(item);
    });
}

function toggleDropdown(type) {
    const box = document.getElementById(`box-${type}`);
    if (box.classList.contains('disabled')) return;

    const optionsEl = document.getElementById(`options-${type}`);
    const isOpen = optionsEl.classList.contains('show');

    document.querySelectorAll('.dropdown-options').forEach(el => el.classList.remove('show'));

    if (!isOpen) {
        optionsEl.classList.add('show');
    }
}

function selectOption(type, value) {
    selectedValues[type] = value;
    document.getElementById(`text-${type}`).innerText = value;
    document.getElementById(`options-${type}`).classList.remove('show');

    if (type === 'college') {
        resetSelect(['dept', 'path', 'year']);
        updateSelect('dept', structure[value]);
    } else if (type === 'dept') {
        resetSelect(['path', 'year']);
        updateSelect('path', structure[selectedValues.college][value]);
    } else if (type === 'path') {
        resetSelect(['year']);
        updateSelect('year', structure[selectedValues.college][selectedValues.dept][value]);
    } else if (type === 'year') {
        startShowResult();
    }
}

function updateSelect(type, dataSet) {
    const box = document.getElementById(`box-${type}`);
    const text = document.getElementById(`text-${type}`);
    const optArea = document.getElementById(`options-${type}`);

    text.innerText = '-- 請選擇 --';
    optArea.innerHTML = '';

    if (dataSet) {
        Object.keys(dataSet).sort().forEach(k => {
            const item = document.createElement('div');
            item.className = 'dropdown-option-item';
            item.innerText = k;
            item.onclick = () => selectOption(type, k);
            optArea.appendChild(item);
        });
        box.classList.remove('disabled');
    }
}

function resetSelect(types) {
    types.forEach(t => {
        selectedValues[t] = '';
        const box = document.getElementById(`box-${t}`);
        const text = document.getElementById(`text-${t}`);
        const optArea = document.getElementById(`options-${t}`);

        text.innerText = '請先選擇上一項';
        optArea.innerHTML = '';
        box.classList.add('disabled');
    });
    document.getElementById('result').style.display = 'none';
}

// 點擊空白處關閉所有選單
window.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.dropdown-options').forEach(el => el.classList.remove('show'));
    }
});

// 初始化結果顯示
function startShowResult() {
    const { college, dept, path, year } = selectedValues;
    currentDataList = structure[college][dept][path][year];
    currentIndex = 0;
    renderData();
}

// 渲染特定索引的資料
function renderData() {
    const info = currentDataList[currentIndex];
    if (!info) return;
    document.getElementById('res-type').innerText = info['個人、團體？'] || '無資料';
    document.getElementById('res-stus').innerText = (info['一場面試幾個考生？'] || '0') + ' 人';
    document.getElementById('res-profs').innerText = (info['一場面試有幾個教授？'] || '0') + ' 位';
    document.getElementById('res-layout').innerText = info['考場長怎樣呢？'] || '無資料';
    document.getElementById('res-combined').innerText = info['面試問題及流程'] || '無資料';
    
    const adviceKey = Object.keys(info).find(k => k.includes('有沒有什麼想告訴學弟妹的～'));
    document.getElementById('res-advice').innerText = info[adviceKey] || '無資料';
    
    // 分頁控制邏輯 (即使只有一筆也顯示)
    const pagArea = document.getElementById('pag-area');
    pagArea.style.display = 'flex';     // 強制顯示分頁區域
    document.getElementById('pag-text').innerText = `目前資料：第 ${currentIndex + 1} / ${currentDataList.length} 筆`;     // 顯示文字

    // 防呆
    document.getElementById('btn-prev').disabled = (currentIndex === 0);     // 如果在第一筆，禁用「上一筆」
    document.getElementById('btn-next').disabled = (currentIndex === currentDataList.length - 1);     // 如果在最後一筆（包含只有一筆的情況），禁用「下一筆」

    document.getElementById('result').style.display = 'block';     // 顯示結果
}

// 切換頁面
function changePage(step) {
    currentIndex += step;
    renderData();
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });     // 切換時自動滾動回頂部
}
