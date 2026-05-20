import { clamp, randomInt } from "../../utils/utils.js";

class Stat {
    constructor(name, baseValue, statModifiers = [], min = 0, max = Infinity) {
        this.name = name;
        this.min = min;
        this.baseMin = min;
        this.max = max;
        this.baseMax = max;
        this.baseValue = baseValue;
        this.currentValue = baseValue;
        this.statModifiers = statModifiers;
    };

    onChange() {

    };

    update(dStat, dt = 0) {
        this.currentValue = clamp(this.currentValue + dStat, this.min, this.max);

        this.onChange(dt);
    };

    addStatModifier(dt, statModifier) {
        this.statModifiers.push(statModifier);
        this.calculateValues(dt);
    };

    calculateValues() {
        this.currentValue = this.baseValue;
        this.min = this.baseMin;
        this.max = this.baseMax;

        for (const statModifier of this.statModifiers) {
            if (statModifier.flatMax) {
                this.max += statModifier.flatMax;
                this.currentValue += statModifier.flatMax;
            };
            if (statModifier.flatMin) {
                this.min += statModifier.flatMin;
            };
            if (statModifier.scaleMax) {
                this.max *= statModifier.scaleMax;
            };
            if (statModifier.scaleMin) {
                this.min *= statModifier.scaleMin;
            };
        };

        this.currentValue += this.max - this.baseMax;

        if (this.max < this.min) this.max = this.min;
        if (this.min > this.max) this.min = this.max;
        this.currentValue = clamp(this.currentValue, this.min, this.max);

        this.onChange();
    };
};

class HpStat extends Stat {
    constructor(character) {
        super('Hp', 100, [], 0, 100)

        this.character = character;
        this.character.Stats.Hp = this;

        this.color = 'red';
        this.color2 = 'rgba(255, 0, 0, 0.25)';
    };

    onChange() {
        if(this.currentValue <= 0) {
            this.character.die();
        };
    };
};

class BreathStat extends Stat {
    constructor(character) {
        super('Breath', 100, [], 0, 100)

        this.character = character;
        this.character.Stats.Breath = this;

        this.color = 'blue';
        this.color2 = 'rgba(0, 0, 255, 0.25)';
    };

    onChange(dt = 0) {
        if(this.currentValue <= 0) {
            this.character.Stats.Hp.update(-10 * dt)
        };  
    };
};

class DamageStat extends Stat {
    constructor(character) {
        super('Damage', 5, [], 5, 20);

        this.character = character;
        this.character.Stats.Damage = this;
    };

    rollValue() {
        this.currentValue = randomInt(this.max, this.min);
        return this.currentValue;
    };
};

class DefenseStat extends Stat {
    constructor(character) {
        super('Defense', 0, [], 0, 2);

        this.character = character;
        this.character.Stats.Defense = this;
    };

    rollValue() {
        this.currentValue = randomInt(this.max, this.min);
        return this.currentValue;
    };
};

class HungerStat extends Stat {
    constructor(character) {
        super('Hunger', 100, [], 0, 100);

        this.character = character;
        this.character.Stats.Hunger = this;

        this.color = 'orange';
        this.color2 = 'rgba(255, 165, 0, 0.25)';
    };

    onChange() {
        if(this.currentValue <= 0) {
            // console.log(`CHARACTER ${this.character.id} DEAD!!!`);
        };
    };
};

class StaminaStat extends Stat {
    constructor(character) {
        super('Stamina', 100, [], 0, 100);

        this.character = character;
        this.character.Stats.Stamina = this;

        this.color = 'green';
        this.color2 = 'rgba(0, 255, 0, 0.25)';
    };

    onChange() {
        if(this.currentValue <= 0) {
            this.character.Stats.MovementSpeed.currentValue = 0.25;
        } else {
            this.character.Stats.MovementSpeed.currentValue = this.character.walking ? 0.5 : 1;
        };
    };
};

class MovementSpeedStat extends Stat {
    constructor(character) {
        super('MovementSpeed', 1, [], 0, 1);

        this.character = character;
        this.character.Stats.MovementSpeed = this;
    };
};

export class CharacterStats {
    constructor(character, baseStats, statModifiers) {
        new HpStat(character);
        new HungerStat(character);

        new StaminaStat(character);
        new BreathStat(character);
        new MovementSpeedStat(character);


        new DamageStat(character);
        new DefenseStat(character);
    };
};

class ItemStats {};

class StatModifier {};