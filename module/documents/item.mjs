/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class FUItem extends Item {
	/**
	 * Augment the basic Item data model with additional dynamic data.
	 * This method is automatically called when an item is created or updated.
	 */
	prepareData() {
		// As with the actor class, items are documents that can have their data
		// preparation methods overridden (such as prepareBaseData()).
		super.prepareData();
	}

	/**
	 * Prepare a data object which is passed to any Roll formulas that are created related to this Item.
	 * @private
	 * @returns {object|null} The roll data object, or null if no actor is associated with this item.
	 */
	getRollData() {
		// If present, return the actor's roll data.
		if (!this.actor) return null;
		const rollData = this.actor.getRollData();

		// Grab the item's system data as well.
		rollData.item = foundry.utils.deepClone(this.system);

		return rollData;
	}

	/**
	 * Get the display data for a weapon item.
	 *
	 * @returns {object|boolean} An object containing weapon display information, or false if this is not a weapon.
	 * @property {string} attackString - The weapon's attack description.
	 * @property {string} damageString - The weapon's damage description.
	 * @property {string} qualityString - The weapon's quality description.
	 */
	getWeaponDisplayData() {
		const isWeaponOrShieldWithDual = this.type === 'weapon' || (this.type === 'shield' && this.system.isDualShield?.value);

		// Check if this item is not a weapon or not a weapon/shield with dual
		if (this.type !== 'weapon' && !isWeaponOrShieldWithDual) {
			return false;
		}

		function capitalizeFirst(string) {
			if (typeof string !== 'string') {
				// Handle the case where string is not a valid string
				return string;
			}
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		const hrZeroText = this.system.rollInfo?.useWeapon?.hrZero?.value ? 'HR0' : 'HR';
		const qualText = this.system.quality?.value || 'No Quality';

		const qualityString = [capitalizeFirst(this.system.category.value), capitalizeFirst(this.system.hands.value), capitalizeFirst(this.system.type.value), qualText].filter(Boolean).join(' ⬩ ');

		const attackAttributes = [this.system.attributes.primary.value.toUpperCase(), this.system.attributes.secondary.value.toUpperCase()].join(' + ');

		const attackString = `【${attackAttributes}】${this.system.accuracy.value > 0 ? ` +${this.system.accuracy.value}` : ''}`;

		const damageString = `【${hrZeroText} + ${this.system.damage.value}】 ${this.system.damageType.value}`;

		return {
			attackString,
			damageString,
			qualityString: `【${qualityString}】`,
		};
	}

	/**
	 * Get the display data for an item.
	 *
	 * @returns {object|boolean} An object containing item display information, or false if this is not an item.
	 * @property {string} qualityString - The item's description.
	 */
	getItemDisplayData() {
		// Check if this item is not consumable
		if (this.type !== 'consumable') {
			return false;
		}

		const description = this.system.description;
		const hasDescription = description && description.trim() !== '';

		let qualityString = 'No Description';

		if (hasDescription) {
			const parser = new DOMParser();
			const doc = parser.parseFromString(description, 'text/html');
			qualityString = doc.body.textContent || 'No Description';
		}

		return {
			qualityString: `【${qualityString}】`,
		};
	}

	/**
	 * Get the display data for an item.
	 *
	 * @returns {object|boolean} An object containing skill display information, or false if this is not a skill.
	 * @property {string} qualityString - The skill's description.
	 */
	getSkillDisplayData() {
		// Check if this item is not a skill
		if (this.type !== 'skill' && this.type !== 'miscAbility') {
			return false;
		}

		function capitalizeFirst(string) {
			if (typeof string !== 'string') {
				return string;
			}
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		let weaponMain = null;
		const equippedWeapons = this.actor.items.filter((singleItem) => (singleItem.type === 'weapon' || (singleItem.type === 'shield' && singleItem.system.isDualShield?.value)) && singleItem.system.isEquipped?.value);
		for (const equippedWeapon of equippedWeapons) {
			if (equippedWeapon.system.isEquipped.slot === 'mainHand') {
				weaponMain = equippedWeapon;
			}
		}
		const hasRoll = this.system.hasRoll?.value;
		const hasDamage = this.system.rollInfo?.damage?.hasDamage.value;
		const usesWeapons = this.system.rollInfo?.useWeapon?.accuracy.value;
		const usesWeaponsDamage = this.system.rollInfo?.useWeapon?.damage.value;
		const hrZeroText = this.system.rollInfo?.useWeapon?.hrZero.value ? 'HR0 +' : 'HR +';

		let attackWeaponAttributes, attackAttributes;
		if (usesWeapons && weaponMain) {
			attackWeaponAttributes = [weaponMain?.system?.attributes?.primary.value.toUpperCase(), weaponMain?.system?.attributes?.secondary.value.toUpperCase()].join(' + ');
		} else {
			attackWeaponAttributes = '';
		}

		if (hasRoll) {
			attackAttributes = [this.system?.rollInfo?.attributes?.primary.value.toUpperCase(), this.system?.rollInfo?.attributes?.secondary.value.toUpperCase()].join(' + ');
		}

		const weaponString = usesWeapons ? (weaponMain ? weaponMain?.name : 'No weapon equipped!') : '';

		let attackString = '';
		if (hasRoll || usesWeapons) {
			attackString = usesWeapons
				? `【${attackWeaponAttributes}】${weaponMain ? (weaponMain?.system?.accuracy?.value > 0 ? ` + ${weaponMain?.system?.accuracy?.value}` : '') : ''}`
				: `【${attackAttributes}】${this.system?.rollInfo?.accuracy?.value > 0 ? ` + ${this.system?.rollInfo?.accuracy?.value}` : ''}`;
		}

		let damageString = '';
		if (hasDamage || usesWeaponsDamage) {
			damageString = usesWeapons
				? `【${hrZeroText} ${weaponMain ? `${weaponMain?.system?.damage.value}】 ${weaponMain?.system?.damageType.value}` : ''}`
				: `【${hrZeroText} ${this.system?.rollInfo?.damage?.value > 0 ? ` ${this.system?.rollInfo?.damage?.value}` : '0'} 】${this.system?.rollInfo?.damage.type.value}`;
		}

		const qualityString = [capitalizeFirst(this.system?.class?.value), weaponString, attackString, damageString].filter(Boolean).join(' ⬩ ');

		return {
			qualityString: `${qualityString}`,
		};
	}

	//【】
	/**
	 * Asynchronously calculates and retrieves the single roll information for an item.
	 *
	 * @param {Item|null} usedItem - The item to be used for the roll, or null to use the current item.
	 * @param {boolean} addName - Whether to add the item's name to the output.
	 * @param {boolean} isShiftPressed - Whether the Shift key is pressed.
	 * @returns {Promise<string>} A formatted HTML string containing the roll information.
	 * @throws {Error} Throws an error if the roll cannot be evaluated.
	 */
	async getSingleRollForItem(usedItem = null, addName = false, isShiftPressed = false) {
		const item = usedItem || this;
		let content = '';

		const hasImpDamage = ['ritual'].includes(item.type) && item.system.rollInfo?.impdamage?.hasImpDamage?.value;
		const isWeapon = item.type === 'weapon' || (item.type === 'shield' && item.system.isDualShield?.value);
		const hasDamage = isWeapon || (['spell', 'skill', 'miscAbility'].includes(item.type) && item.system.rollInfo?.damage?.hasDamage?.value);

		const attrs = isWeapon ? item.system.attributes : item.system.rollInfo.attributes;
		const accVal = isWeapon ? item.system.accuracy.value : item.system.rollInfo.accuracy.value || 0;
		const primary = this.actor.system.attributes[attrs.primary.value].current;
		const secondary = this.actor.system.attributes[attrs.secondary.value].current;
		const roll = new Roll('1d@prim + 1d@sec + @mod', {
			prim: primary,
			sec: secondary,
			mod: accVal,
		});
		await roll.evaluate({ async: true });

		// Check if the 'dice-so-nice' module is active
		if (game.modules.get('dice-so-nice')?.active) {
			await game.dice3d.showForRoll(roll, game.user, false, null, false, null, null);
		}

		const bonusAccVal = usedItem ? this.system.rollInfo.accuracy.value : 0;
		const bonusAccValString = bonusAccVal ? ` + ${bonusAccVal} (${this.type})` : '';
		const acc = roll.total + bonusAccVal;
		const diceResults = roll.terms.filter((term) => term.results).map((die) => die.results[0].result);

		// Save the original value of hrZero
		const originalHrZero = item.system.rollInfo?.useWeapon?.hrZero?.value;

		// Temporarily set hrZero to true if Shift is pressed
		if (isShiftPressed) {
			item.system.rollInfo.useWeapon.hrZero.value = true;
		}

		const hr = item.system.rollInfo?.useWeapon?.hrZero?.value ? 0 : Math.max(...diceResults);
		const isFumble = diceResults[0] === 1 && diceResults[1] === 1;
		const isCrit = !isFumble && diceResults[0] === diceResults[1] && diceResults[0] >= 6;

		const accString = `${diceResults[0]} (${attrs.primary.value.toUpperCase()}) + ${diceResults[1]} (${attrs.secondary.value.toUpperCase()}) + ${accVal} (${item.type})${bonusAccValString}`;
		const fumbleString = isFumble ? '<strong>FUMBLE!</strong><br />' : '';
		const critString = isCrit ? '<strong>CRITICAL HIT!</strong><br />' : '';

		if (addName) {
			content += `<strong>${item.name}</strong><br />`;
		}

		content += `
    <div class="accuracy-desc align-left">
      <span class="result-text">${critString}${fumbleString}</span>
      <div class="accuracy-box">
        <span class="accuracy-title">Accuracy</span>
      </div>
      <div class="accuracy-details">
        <span class="accuracy-detail-text">
          ${diceResults[0]} <strong>(${attrs.primary.value.toUpperCase()})</strong>
          + ${diceResults[1]} <strong>(${attrs.secondary.value.toUpperCase()})</strong>
          + ${accVal}
        </span>
      </div>
      <div class="float-box acc-float">
        <span class="float-text" style="">${acc}</span> to hit!
      </div>
    </div>
  `;

		if (hasDamage) {
			let damVal = isWeapon ? item.system.damage.value : item.system.rollInfo.damage.value;
			damVal = damVal || 0;
			const bonusDamVal = usedItem ? this.system.rollInfo.damage.value : 0;
			const bonusDamValString = bonusDamVal ? ` + ${bonusDamVal} (${this.type})` : '';
			const damage = hr + damVal + bonusDamVal;
			const damType = isWeapon ? item.system.damageType.value : item.system.rollInfo.damage.type.value;

			content += `
      <div class="damage-desc align-left">
        <div class="damage-box">
          <span class="damage-title">Damage</span>
        </div>
        <div class="damage-details">
          <span class="damage-detail-text">
            ${hr} <strong>(HR)</strong> + ${damVal}
          </span>
        </div>
        <div class="float-box dam-float">
          <span class="float-text" style="">${damage}</span> ${damType}!
        </div>
      </div>
    `;
		}

		if (hasImpDamage) {
			const damageTable = {
				5: { minor: 10, heavy: 30, massive: 40 },
				20: { minor: 20, heavy: 40, massive: 60 },
				40: { minor: 30, heavy: 50, massive: 80 },
			};
			const level = item.actor.system.level.value;
			const improvType = item.type === 'ritual' ? item.system.rollInfo.impdamage.impType.value : '';
			const damage = damageTable[level >= 40 ? 40 : level >= 20 ? 20 : 5][improvType] || 0;
			const damType = item.type === 'ritual' ? item.system.rollInfo.impdamage.type.value : '';

			content += `
      <div class="damage-desc align-left">
        <div class="damage-box">
          <span class="damage-title">Improvise</span>
        </div>
        <div class="damage-details">
          <span class="damage-detail-text">
            <strong>${improvType}</strong> damage
          </span>
        </div>
        <div class="float-box dam-float">
          <span class="float-text" style="">${damage}</span> ${damType}!
        </div>
      </div>
    `;
		}

		// Restore the original value of hrZero if it was changed
		if (isShiftPressed) {
			item.system.rollInfo.useWeapon.hrZero.value = originalHrZero;
		}

		return content;
	}

	async getRollString(isShiftPressed) {
		const isSpellOrSkill = ['spell', 'skill', 'miscAbility', 'ritual'].includes(this.type);

		const isWeaponOrShieldWithDual = this.type === 'weapon' || (this.type === 'shield' && this.system.isDualShield?.value);

		const hasRoll = isWeaponOrShieldWithDual || (isSpellOrSkill && this.system.hasRoll?.value);

		let mainHandContent = '';
		let offHandContent = '';
		let otherContent = '';

		if (hasRoll) {
			const usesWeapons = isSpellOrSkill && (this.system.rollInfo?.useWeapon?.accuracy?.value || this.system.rollInfo?.useWeapon?.damage?.value);

			if (usesWeapons) {
				const equippedWeapons = this.actor.items.filter((singleItem) => (singleItem.type === 'weapon' || (singleItem.type === 'shield' && singleItem.system.isDualShield?.value)) && singleItem.system.isEquipped?.value);

				for (const equippedWeapon of equippedWeapons) {
					const data = await this.getSingleRollForItem(equippedWeapon, true, isShiftPressed);
					if (equippedWeapon.system.isEquipped.slot === 'mainHand') {
						mainHandContent += data;
					} else if (equippedWeapon.system.isEquipped.slot === 'offHand') {
						offHandContent += data;
					}
				}

				if (mainHandContent === '' && offHandContent === '') {
					mainHandContent = "<div style='display:none;'>";
					offHandContent = "<div style='display:none;'>";
				} else {
					mainHandContent = mainHandContent || '<strong>No Main-Hand Equipped!</strong>';
					offHandContent = offHandContent || '<strong>No Off-Hand Equipped!</strong>';
				}

				mainHandContent = `<p class="mainhand-header">Main: ${mainHandContent}</p>`;
				offHandContent = `<p class="offhand-header">Off: ${offHandContent}</p>`;
			} else {
				otherContent = await this.getSingleRollForItem(null, false, isShiftPressed);
			}
		}

		// Conditional rendering for otherContent can be added here if needed.
		// Example:
		// if (otherContent !== null) {
		//   otherContent = `<p class="other-header">${otherContent}</p>`;
		// }

		return mainHandContent + offHandContent + otherContent;
	}

	getDescriptionString() {
		const item = this;
		const summary = item.system.summary.value;
		const hasSummary = summary && summary.trim() !== '';
		const description = item.system.description;
		const hasDescription = description && description.trim() !== '';

		if (hasSummary || hasDescription) {
			return `<div class="chat-desc">
        ${hasSummary ? `<blockquote class="summary quote">${summary}</blockquote>` : ''}
        ${hasDescription ? `<span>${description}</span>` : ''}
      </div>`;
		} else {
			return '';
		}
	}

	getQualityString() {
		if (!['weapon', 'shield', 'armor', 'accessory'].includes(this.type)) {
			return '';
		}
		const DEF = game.i18n.localize('FU.DefenseAbbr');
		const MDEF = game.i18n.localize('FU.MagicDefenseAbbr');
		const INIT = game.i18n.localize('FU.InitiativeAbbr');
		const hasQualityValue = this.system.quality.value.trim() !== '';
		function capitalizeFirst(string) {
			if (typeof string !== 'string') {
				return string;
			}
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		let content = '';

		if (['weapon', 'shield', 'armor', 'accessory'].includes(this.type)) {
			content += `
        <div class="detail-desc flex-group-center grid grid-3col">
          ${['weapon'].includes(this.type) || (this.type === 'shield' && this.system.isDualShield.value && this.system.type) ? `<div>${capitalizeFirst(this.system.type.value)}</div>` : ''}
          ${['weapon'].includes(this.type) || (this.type === 'shield' && this.system.isDualShield.value && this.system.hands) ? `<div>${capitalizeFirst(this.system.hands.value)}</div>` : ''}
          ${['weapon'].includes(this.type) || (this.type === 'shield' && this.system.isDualShield.value && this.system.category) ? `<div>${capitalizeFirst(this.system.category.value)}</div>` : ''}
          ${['shield', 'armor', 'accessory'].includes(this.type) ? `<div>${DEF} ${this.system.def.value}</div>` : ''}
          ${['shield', 'armor', 'accessory'].includes(this.type) ? `<div>${MDEF} ${this.system.mdef.value}</div>` : ''}
          ${['shield', 'armor', 'accessory'].includes(this.type) ? `<div>${INIT} ${this.system.init.value}</div>` : ''}
        </div>`;

			if (hasQualityValue) {
				content += `
          <div class="detail-desc flexrow" style="padding: 0 2px;">
            <div>Quality: ${this.system.quality.value}</div>
          </div>`;
			}
		}
		return content;
	}

	getSpellDataString() {
		const item = this;
		if (item.type !== 'spell') {
			return '';
		}
		if (item.type === 'spell') {
			const { mpCost, target, duration } = item.system;
			return `<div class="detail-desc flex-group-center grid grid-3col">
                <div>${duration.value}</div>
                <div>${target.value}</div>
                <div>${mpCost.value} MP</div>
              </div>`;
		}
		return '';
	}

	getRitualDataString() {
		const item = this;
		if (this.type !== 'ritual') {
			return '';
		}

		if (item.type === 'ritual') {
			const { mpCost, dLevel, clock } = this.system;
			return `<div class="detail-desc flex-group-center grid grid-3col">
                <div>${mpCost.value} MP</div>
                <div>${dLevel.value} DL</div>
                <div>Clock ${clock.value}</div>
              </div>`;
		}
		return '';
	}

	getProjectDataString() {
		const item = this;
		if (item.type !== 'project') {
			return '';
		}

		if (item.type === 'project') {
			const { cost, discount, progress, progressPerDay, days } = item.system;

			const discountText = discount.value ? `<span><br>-${discount.value} Discount</span>` : '';

			return `<div class="detail-desc flex-group-center grid grid-3col">
                <div>
                  <span>${cost.value} Zenith</span>
                  ${discountText}
                </div>
                <div>${progress.value} Progress</div>
                <div>${progressPerDay.value} progress per day / ${days.value} days</div>
              </div>`;
		}
		return '';
	}

	getHeroicDataString() {
		if (this.type !== 'heroic') {
			return '';
		}

		const { class: heroicClass, requirement, heroicStyle } = this.system;

		if ((heroicClass && heroicClass.value.trim()) || (requirement && requirement.value.trim()) || (heroicStyle && heroicStyle.value.trim())) {
			return `<div class="detail-desc flex-group-center">
                ${heroicClass && heroicClass.value.trim() ? `<div>Class: ${heroicClass.value}</div>` : ''}
                ${requirement && requirement.value.trim() ? `<div>Requirements: ${requirement.value}</div>` : ''}
              </div>`;
		}

		return '';
	}

	getZeroDataString() {
		if (this.type !== 'zeroPower') {
			return '';
		}
		const {
			system: { zeroTrigger, zeroEffect, trigger },
		} = this;
		const hasZeroTrigger = zeroTrigger.description?.trim();
		const hasZeroEffect = zeroEffect.description?.trim();

		if (hasZeroTrigger || hasZeroEffect) {
			return `
        <div class="detail-desc flex-group-center grid grid-3col"> 
          <div>${zeroTrigger.value}</div>
          <div>${zeroEffect.value}</div>
          <div>Clock <br> ${trigger.current} / ${trigger.max} </div>
        </div>
        <div class="chat-desc">
          ${hasZeroTrigger ? `<div class="resource-label">${zeroTrigger.value}</div><div>${zeroTrigger.description}</div>` : ''}
          ${hasZeroEffect ? `<div class="resource-label">${zeroEffect.value}</div><div>${zeroEffect.description}</div>` : ''}
        </div>`;
		}
		return '';
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event The originating click event.
	 * @private
	 */
	async roll(isShiftPressed) {
		const item = this;
		const { system, img, name, type } = item;
		// Initialize chat data.
		const speaker = ChatMessage.getSpeaker({ actor: item.actor });
		const rollMode = game.settings.get('core', 'rollMode');

		const label = `
    <div class="title-desc">
      <div class="flex-group-center backgroundstyle">
        <img src="${img}" alt="Image" />
        <p>${name}</p>
      </div>
    </div>
  `;

		// Check if there's no roll data
		if (!system.formula) {
			const chatdesc = item.getDescriptionString();
			const attackData = await item.getRollString(isShiftPressed);
			const spellString = item.getSpellDataString();
			const ritualString = item.getRitualDataString();
			const projectString = item.getProjectDataString();
			const heroicString = item.getHeroicDataString();
			const zeroString = item.getZeroDataString();
			const qualityString = item.getQualityString();

			const attackString = Array.isArray(attackData) ? attackData.join('<br /><br />') : attackData;

			// Prepare the content by filtering and joining various parts.
			const content = [qualityString, spellString, ritualString, projectString, heroicString, zeroString, chatdesc, attackString].filter((part) => part).join('');

			if (['spell'].includes(type)) {
				socketlib.system.executeForEveryone('cast', name);
			}
			if (['consumable', 'skill', 'weapon'].includes(type) || system.showTitleCard?.value) {
				socketlib.system.executeForEveryone('use', name);
			}

			// Create a chat message.
			ChatMessage.create({
				speaker: speaker,
				rollMode: 'roll',
				flavor: label,
				content,
				flags: { item },
			});
		} else {
			// Retrieve roll data.
			const rollData = item.getRollData();

			// Invoke the roll and submit it to chat.
			const roll = new Roll(rollData.item.formula, rollData);
			roll.toMessage({
				speaker: speaker,
				rollMode: rollMode,
				flavor: label,
			});
			return roll;
		}
	}
}
