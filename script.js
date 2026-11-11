const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTikTWQ1NHtmCIoslCCUnqJ_b-UOvFNnF2jkTFRYLthASVeGCZJOZDD5d9gZoy4X3zeQLhb-yHF2CRB/pub?output=csv';     // google sheet

let structure = {};
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

        const path = row['面試管道']?.trim() || "一般招生";
        const yr = row['面試學年度']?.trim() || "114";

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
    const s1 = document.getElementById('sel-college'), s2 = document.getElementById('sel-dept'), s3 = document.getElementById('sel-path'), s4 = document.getElementById('sel-year');
    const colleges = Object.keys(structure).sort();
    s1.innerHTML = '<option value="">-- 選擇學院 --</option>';
    colleges.forEach(c => s1.add(new Option(c, c)));
    s1.disabled = false;
    s1.onchange = () => { resetSelect(['sel-dept', 'sel-path', 'sel-year']); updateSelect(s2, structure[s1.value]); };
    s2.onchange = () => { resetSelect(['sel-path', 'sel-year']); updateSelect(s3, structure[s1.value][s2.value]); };
    s3.onchange = () => { resetSelect(['sel-year']); updateSelect(s4, structure[s1.value][s2.value][s3.value]); };
    s4.onchange = startShowResult;
}

function updateSelect(el, dataSet) {
    el.innerHTML = '<option value="">-- 請選擇 --</option>';
    if (dataSet) { Object.keys(dataSet).sort().forEach(k => el.add(new Option(k, k))); el.disabled = false; }
}

function resetSelect(ids) {
    ids.forEach(id => { const el = document.getElementById(id); el.innerHTML = '<option value="">請先選擇上一項</option>'; el.disabled = true; });
    document.getElementById('result').style.display = 'none';
}

// 初始化結果顯示
function startShowResult() {
    const college = document.getElementById('sel-college').value;
    const dept = document.getElementById('sel-dept').value;
    const path = document.getElementById('sel-path').value;
    const year = document.getElementById('sel-year').value;
    
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
    
    // 強制顯示分頁區域
    pagArea.style.display = 'flex'; 
    
    // 顯示文字
    document.getElementById('pag-text').innerText = `目前資料：第 ${currentIndex + 1} / ${currentDataList.length} 筆`;

    // 防呆
    // 如果在第一筆，禁用「上一筆」
    document.getElementById('btn-prev').disabled = (currentIndex === 0);
    
    // 如果在最後一筆（包含只有一筆的情況），禁用「下一筆」
    document.getElementById('btn-next').disabled = (currentIndex === currentDataList.length - 1);

    // 顯示結果
    document.getElementById('result').style.display = 'block';
}

// 切換頁面函式
function changePage(step) {
    currentIndex += step;
    renderData();
    // 切換時自動滾動回頂部，體驗較好
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
