export const dropTableData = {
    "DT2": { name: "Heavy Weapons", pool: ["sword", "axe", "scythe", "mace"], crossDrop: "DT3" },
    "DT3": { name: "Light/Ranged", pool: ["bow", "arrow", "claw"], crossDrop: "DT2" },
    "DT4": { name: "Lower Armor", pool: ["legs", "boots"], crossDrop: null },
    "DT5": { name: "Upper Armor", pool: ["helm", "gloves"], crossDrop: null },
    "DT6": { name: "Elemental Magic", pool: ["damageSpell1", "damageSpell2"], crossDrop: null },
    "DT7": { name: "Armor", pool: ["helm", "chest", "legs", "boots", "gloves"], crossDrop: null },
    "DT8": { name: "Support Magic", pool: ["buffSpell1", "buffSpell2", "healSpell1"], crossDrop: "DT6" }
};