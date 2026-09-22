import fs from 'fs';

const filePath = './src/data/zonesData.js';
let data = fs.readFileSync(filePath, 'utf-8');

const gradeMap = {
    "Rough": 1, "Chipped": 2, "Flawed": 3, "Normal": 4, 
    "Polished": 5, "Radiant": 6, "Flawless": 7, "Mythic": 8, "Divine": 9
};

Object.entries(gradeMap).forEach(([str, num]) => {
    data = data.replaceAll(`"gemGradeMin":"${str}"`, `"gemGradeMin":${num}`);
    data = data.replaceAll(`"gemGradeMax":"${str}"`, `"gemGradeMax":${num}`);
});

fs.writeFileSync(filePath, data, 'utf-8');
console.log('✅ zonesData.js successfully converted to pure integers!');