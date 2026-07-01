export const divineFlagsPack = {
      trigger: { minCount: 5 },
      flags: [
        { id: 'flag_fire_attack', name: '火攻', category: '變盤型', description: '將隨機顏色的珠子變成紅珠。', effect: { type: 'convert_random_color_to_color', params: { targetColor: 'red', sourceColor: 'random' } }, icon: 'assets/divine-flags-pack/icons/flag_fire_attack.png' },
        { id: 'flag_east_wind', name: '借東風', category: '強化型', description: '當局火珠變成強化火珠，強化火珠傷害 1.2 倍。', effect: { type: 'enhance_color_orbs', params: { targetColor: 'red', enhancedColor: 'enhancedRed', damageMultiplier: 1.2, duration: 'current_board' } }, icon: 'assets/divine-flags-pack/icons/flag_east_wind.png' },
        { id: 'flag_azure_dragon', name: '青龍現世', category: '爆發型', description: '下一次消除紅珠時，傷害 ×3。', effect: { type: 'next_color_match_damage_multiplier', params: { targetColor: 'red', damageMultiplier: 3, consumeOnTrigger: true } }, icon: 'assets/divine-flags-pack/icons/flag_azure_dragon.png' },
        { id: 'flag_seven_star_lamp', name: '七星燈', category: '資源型', description: '生成 3 顆彩虹珠。彩虹珠視為萬用顏色。', effect: { type: 'spawn_orbs', params: { orbColor: 'rainbow', count: 3, rainbowIsWildcard: true } }, icon: 'assets/divine-flags-pack/icons/flag_seven_star_lamp.png' },
        { id: 'flag_arrow_rain', name: '萬箭齊發', category: '傷害型', description: '所有敵人受到固定傷害 500。', effect: { type: 'fixed_damage_all_enemies', params: { damage: 500 } }, icon: 'assets/divine-flags-pack/icons/flag_arrow_rain.png' },
        { id: 'flag_eight_trigrams', name: '八陣圖', category: '防禦型', description: '無敵 2 回合。', effect: { type: 'grant_invincible', params: { durationTurns: 2 } }, icon: 'assets/divine-flags-pack/icons/flag_eight_trigrams.png' },
        { id: 'flag_empty_city', name: '空城計', category: '控制型', description: '降低敵人攻擊力 50%，持續 3 回合。', effect: { type: 'debuff_enemy_attack', params: { attackMultiplier: 0.5, durationTurns: 3, target: 'allEnemies' } }, icon: 'assets/divine-flags-pack/icons/flag_empty_city.png' },
        { id: 'flag_heaven_thunder', name: '天降神雷', category: '爆發型', description: '指定一種顏色，全部炸掉。', effect: { type: 'destroy_all_orbs_of_selected_color', params: { selectedColor: 'playerChoice' } }, icon: 'assets/divine-flags-pack/icons/flag_heaven_thunder.png' },
        { id: 'flag_qimen_dunjia', name: '奇門遁甲', category: '變盤型', description: '交換任意兩種珠子的顏色。', effect: { type: 'swap_two_orb_colors', params: { firstColor: 'playerChoice', secondColor: 'playerChoice' } }, icon: 'assets/divine-flags-pack/icons/flag_qimen_dunjia.png' },
        { id: 'flag_heaven_general', name: '天公將軍', category: '強化型', description: '黃色珠子也能發動攻擊，持續 3 回合。', effect: { type: 'enable_color_attack', params: { targetColor: 'yellow', durationTurns: 3 } }, icon: 'assets/divine-flags-pack/icons/flag_heaven_general.png' },
      ],
    };
