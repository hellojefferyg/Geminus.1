// Goes up one level (out of utils) to find the data folder
import { monsterTitles } from "../data/monsterTitles";

export const getScaledMobStats = (baseMob, zoneData, titleKey = null) => {
    // Force numbers to prevent NaN crashes
    const dangerRating = parseFloat(zoneData?.dangerRating) || 1.0;
    const goldMultiplier = parseFloat(zoneData?.goldMultiplier) || 1.0;
    const title = titleKey ? monsterTitles[titleKey] : null;

    let hp = (Number(baseMob.hp) || 0) * dangerRating;
    let dmg = (Number(baseMob.damage) || 0) * dangerRating;
    let gold = (Number(baseMob.goldValue) || 10) * goldMultiplier;

    if (title) {
        hp *= (title.hpMult || title.statMult || 1);
        dmg *= (title.statMult || 1);
        gold *= (title.goldMult || 1);
    }

    return {
    ...baseMob,
    // FIX: Standardize name and goldValue lookups
    displayName: titleKey ? `${titleKey} ${baseMob.name}` : baseMob.name,
    hp: Math.floor(hp),
    damage: Math.floor(dmg),
    goldValue: Math.floor(gold) 
};
};