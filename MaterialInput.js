/*!
 * MaterialInput
 * (c) 2020 Théo BENOIT mailto:theo.benoit16@gmail.com
 * MIT License
 * https://github.com/Androlax2/material-input
 */

'use strict';

/**
 * An attribute is missing
 */
class MissingAttributeError extends Error {
	constructor(message) {
		super(message);
		this.name = 'MissingAttributeError';
	}
}

/**
 * Type is not valid or not supported for now
 */
class NotValidTypeError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NotValidTypeError';
	}
}

/**
 * TODO : - PREFIX CSS
 * TODO : - MAKE THE READ ME
 */
class MaterialInput extends HTMLElement {

	constructor() {
		super();
		this._handleAttributesExceptions(this._mandatoryAttributes());
		this._handleTypesExceptions(this._supportedTypes());
		this.addEventListener('connected', () => {
			this._insertHiddenInput();
			this._cacheDOM();
			this._handleEvents();
			this._transferAttributes();
		});
		this.UUID = this._generateUUID();
	}

	/**
	 * Observe attributes
	 *
	 * @returns {string[]}
	 */
	static get observedAttributes() {
		return [
			'value',
			'placeholder'
		];
	}

	/**
	 * Get the name attribute
	 *
	 * @returns {string}
	 */
	get name() {
		return this.getAttribute('name');
	}

	/**
	 * Get the label attribute
	 *
	 * @returns {string}
	 */
	get label() {
		return this.getAttribute('label');
	}

	/**
	 * Get the type attribute
	 *
	 * @returns {string}
	 */
	get type() {
		return this.getAttribute('type');
	}

	/**
	 * Get value attribute
	 *
	 * @returns {string}
	 */
	get value() {
		return this.getAttribute('value');
	}

	/**
	 * Set value
	 *
	 * @param {string} value
	 */
	set value(value) {
		if (value) {
			if (this.$hiddenInput) {
				if (this.type === 'textarea') {
					this.$hiddenInput.innerHTML = value;
				} else {
					this.$hiddenInput.setAttribute('value', value);
				}
			}
			if (this.$input) this.$input.setAttribute('value', value);
			this.setAttribute('value', value);
		} else {
			if (this.$hiddenInput) {
				if (this.type === 'textarea') {
					this.$hiddenInput.innerHTML = null;
				} else {
					this.$hiddenInput.removeAttribute('value');
				}
			}
			if (this.$input) this.$input.removeAttribute('value');
			this.removeAttribute('value');
		}
	}

	/**
	 * Get value attribute
	 *
	 * @returns {string}
	 */
	get placeholder() {
		return this.getAttribute('placeholder');
	}

	/**
	 * Set placeholder
	 *
	 * @param {string} placeholder
	 */
	set placeholder(placeholder) {
		if (placeholder) {
			if (this.$input) this.$input.setAttribute('placeholder', placeholder);
			this.setAttribute('placeholder', placeholder);
		} else {
			if (this.$input) this.$input.removeAttribute('placeholder');
			this.removeAttribute('placeholder');
		}
	}

	/**
	 * Is the material input initialized ?
	 *
	 * @returns {boolean}
	 */
	get isInitialized() {
		return this.hasAttribute('is-initialized');
	}

	/**
	 * Set the material input as initialized
	 *
	 * @param value
	 */
	set isInitialized(value) {
		if (value) {
			this.setAttribute('is-initialized', '');
		} else {
			this.removeAttribute('is-initialized');
		}
	}

	/**
	 * Is the material input focused ?
	 *
	 * @returns {boolean}
	 */
	get isFocused() {
		return this.hasAttribute('is-focused');
	}

	/**
	 * Set the material input as focused
	 *
	 * @param value
	 */
	set isFocused(value) {
		if (value) {
			this.setAttribute('is-focused', '');
		} else {
			this.removeAttribute('is-focused');
		}
	}

	/**
	 * When the custom element is removed from the DOM
	 */
	disconnectedCallback() {
		if (this.type === 'textarea') {
			window.removeEventListener('resize', this._onResizeTextarea);
		}
	}

	/**
	 * Custom elements proper attributes, don't transfer them to input and hidden input
	 *
	 * @returns {string[]} attributes to don't transfer
	 * @private
	 */
	_customElementsAttributes() {
		return [
			'class',
			'name',
			'id',
			'style',
			'type',
			'label',
			'tabindex',
			'value'
		];
	}

	/**
	 * Transfer attributes to hidden input and input in the material input
	 *
	 * @private
	 */
	_transferAttributes() {
		if (this.value) this.value = this.value;

		const dontTransferAttributes = this._customElementsAttributes();
		const attributes = Array.prototype.map.call(
			[...this.attributes].filter(attribute => !dontTransferAttributes.includes(attribute.name)),
			attribute => !attribute.nodeValue ? [attribute.nodeName] : [attribute.nodeName, attribute.nodeValue]
		);
		attributes.map(attribute => {
			const attributeName  = attribute[0],
			      attributeValue = attribute[1] ?? '';

			this.$input.setAttribute(attributeName, attributeValue);
			this.$hiddenInput.setAttribute(attributeName, attributeValue);
		});
	}

	/**
	 * When attribute change
	 *
	 * @param name
	 * @param oldValue
	 * @param newValue
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;

		switch (name) {
			case 'value':
				this.value = newValue;
				break;
			case 'placeholder':
				this.placeholder = newValue;
				break;
		}
	}

	/**
	 * Insert hidden input to be able to send the form
	 *
	 * @private
	 */
	_insertHiddenInput() {
		const style = `
			pointer-events: none; 
			margin:0; 
			border: 0; 
			height: 0; 
			opacity: 0; 
			position: absolute;
			top: ${this.offsetTop + this.offsetHeight}px;
			left: ${this.offsetLeft}px
		`;
		const attributes = {
			'aria-hidden': true,
			'tabindex': -1,
			'type': this.type,
			'name': this.name,
			'class': 'materialInput__hidden'
		};
		let $input;

		if (this.type === 'textarea') {
			$input = document.createElement('textarea');
		} else {
			$input = document.createElement('input');
		}

		$input.setAttribute('style', style);
		//@formatter:off
		Object.keys(attributes).map(attributeName => $input.setAttribute(attributeName, attributes[attributeName]));
		//@formatter:on

		this.insertAdjacentElement('afterend', $input);
	}

	/**
	 * Generate a unique identifier
	 *
	 * @returns {string} unique identifier
	 * @private
	 */
	_generateUUID() {
		let dt = new Date().getTime();
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
			//@formatter:off
			const r = (dt + Math.random() * 16) % 16 | 0;
			dt = Math.floor(dt / 16);
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			//@formatter:on
		});
	}

	/**
	 * Get style of the shadow DOM
	 *
	 * @returns {string} style of the material input
	 * @private
	 */
	_getStyle() {
		return `
			<style>
				:host {
                    display: block;
                    position: relative;
                    background: transparent;
                }
                
                :host {
                	/* LABEL AND INPUT */
                	--materialInput__fontFamily: Arial, Helvetica, sans-serif;
                	--materialInput__fontColor: #9e9e9e;
                	--materialInput__fontLetterSpacing: 0;
                	
                	/* ACTIVE LABEL */
                	--materialInput__labelActiveColor: #4285f4;
                	
                	/* BORDER */
                	--materialInput__borderWidth: 1px;
                	--materialInput__borderColor: #9e9e9e;
                	--materialInput__borderColorActive: #4285f4;
                	
                	/* BORDER TRANSITION */
                	--materialInput__borderRemoveTransitionDelay: .3s;
                	--materialInput__borderRemoveTransition: cubic-bezier(0.4, 0, 0.2, 1);
                	--materialInput__borderAddTransitionDelay: .3s;
                	--materialInput__borderAddTransition: cubic-bezier(0.4, 0, 0.2, 1);
                	
                	/* INPUT PADDINGS */
                	--materialInput__inputPaddingTop: 0.6em;
                	--materialInput__inputPaddingRight: 0;
                	--materialInput__inputPaddingBottom: 0.4em;
                	--materialInput__inputPaddingLeft: 0;
                }
                
                .materialInput__input {
                	font-family: var(--materialInput__fontFamily);
                	appearance: none;
                	box-sizing: border-box;
                	resize: none;
                	outline: none;
				    position: relative;
				    background-color: transparent;
				    font-size: 1em;
				    line-height: 1;
				    letter-spacing: var(--materialInput__fontLetterSpacing);
				    color: var(--materialInput__fontColor);
				    padding: calc(0.85em + var(--materialInput__inputPaddingTop)) var(--materialInput__inputPaddingRight) var(--materialInput__inputPaddingBottom) var(--materialInput__inputPaddingLeft); /* 0.85em is the minimum for padding top (to have the label upper user input) */
				    display: block;
				    width: 100%;
				    border-top: none;
				    border-right: none;
				    border-left: none;
				    border-image: initial;
				    border-bottom: var(--materialInput__borderWidth) solid var(--materialInput__borderColor);
				    box-shadow: none;
                }
                
                .materialInput__input::placeholder {
                	font-family: var(--materialInput__fontFamily);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                textarea.materialInput__input {
                	padding-bottom: calc(var(--materialInput__inputPaddingBottom) + 0.125em); /* 0.125em more for textarea to have the same height of others inputs */
                }
      
                label {
                	font-family: var(--materialInput__fontFamily);
                	color: var(--materialInput__fontColor);
					pointer-events: none;
					position: absolute;
					font-size: 1em;
					letter-spacing: var(--materialInput__fontLetterSpacing);
					top: 0;
					margin-left: var(--materialInput__inputPaddingLeft);
					margin-right: var(--materialInput__inputPaddingRight);
					/* PADDING OF INPUT */
					padding-top: calc(0.85em + var(--materialInput__inputPaddingTop));
					padding-bottom: var(--materialInput__inputPaddingBottom);
					/* PADDING OF INPUT */
					text-align: initial;
					transform-origin: 0 100%;
					will-change: padding-top;
					transition: padding-top .2s ease-out, transform .2s ease-out, color .2s ease-out;
                }
                
                .materialInput__bar {
				    transform: scaleX(0);
				    background-color: var(--materialInput__borderColorActive);
				    height: calc(var(--materialInput__borderWidth) + 1px);
				    left: 0;
				    margin: calc(var(--materialInput__borderWidth) * -1) 0 0;
				    padding: 0;
				    position: absolute;
				    width: 100%;
                }
                
                :host([is-initialized]) .materialInput__bar,
                :host([is-initialized="true"]) .materialInput__bar {
                	animation: materialInputBarRemoveUnderline var(--materialInput__borderRemoveTransitionDelay) var(--materialInput__borderRemoveTransition);
                }
                
                :host([is-focused]) .materialInput__bar,
                :host([is-focused="true"]) .materialInput__bar {
                	animation: materialInputBarAddUnderline var(--materialInput__borderAddTransitionDelay) var(--materialInput__borderAddTransition);
					transform: scaleX(1);
                }
                
                :host([is-focused]) label,
                :host([is-focused="true"]) label {
                	color: var(--materialInput__labelActiveColor);
                	padding-top: 0;
                	transform: scale(0.8);
				    transform-origin: 0 0;
                }
                
                :host([value]) label,
                :host([placeholder]) label {
                	padding-top: 0;
                	transform: scale(0.8);
				    transform-origin: 0 0;
                }
                
                @keyframes materialInputBarRemoveUnderline {
				    0% {
				        transform: scaleX(1);
				        opacity: 1;
				    }
				    to {
				        transform: scaleX(1);
				        opacity: 0;
				    }
				}
				
				@keyframes materialInputBarAddUnderline {
				    0% {
				        transform: scaleX(0);
				    }
				    to {
				        transform: scaleX(1);
				    }
				}
			</style>
		`;
	}

	/**
	 * Get inner content of the shadow DOM
	 *
	 * @returns {string} content of the material input
	 * @private
	 */
	_getInnerContent() {
		const $label = `<label for="${this.UUID}">${this.label}</label>`;
		let $input;

		if (this.type === 'textarea') {
			$input = `<textarea rows="1" id="${this.UUID}" class="materialInput__input" name="${this.name}"></textarea>`;
		} else {
			$input = `<input id="${this.UUID}" class="materialInput__input" type="${this.type}" name="${this.name}" />`;
		}

		const $bar = '<div class="materialInput__bar"></div>';

		return `
			${$label}
			${$input}
			${$bar}
		`;
	}

	/**
	 * Add events on the differents elements
	 *
	 * @private
	 */
	_handleEvents() {
		// Container events
		this.addEventListener('focusin', () => {
			this.isInitialized = true;
			this.isFocused = true;
		});
		this.addEventListener('focusout', () => this.isFocused = false);
		this.addEventListener('click', e => {
			const {left} = e.target.getBoundingClientRect();
			this.$bar.style.transformOrigin = `${e.clientX - left}px center`;
			this.isInitialized = true;
			this.isFocused = true;
		});

		// Input events
		this.$input.addEventListener('input', () => this.value = this.$input.value);

		// Submit form when user press Enter key in the input others than textarea
		if (this.type !== 'textarea') {
			this.$input.addEventListener('keydown', e => e.key === 'Enter' ? this._submitForm() : null);
		} else {
			//@formatter:off
			this.$input.addEventListener('focus', (this._onFocusTextarea).bind(this));
			//@formatter:on
		}
	}

	/**
	 * On focus on textarea
	 *
	 * @private
	 */
	_onFocusTextarea() {
		this.$input.style.overflow = 'hidden';
		this.$input.style.boxSizing = 'border-box';
		this._autoGrowTextarea();

		//@formatter:off
		window.addEventListener('resize', this._debounce((this._onResizeTextarea).bind(this), 300));
		//@formatter:on
		this.addEventListener('input', this._autoGrowTextarea);
		this.removeEventListener('focus', this._onFocusTextarea);
	}

	/**
	 * On window resize adapt textarea
	 *
	 * @private
	 */
	_onResizeTextarea() {
		this._autoGrowTextarea();
	}

	/**
	 * Make textarea auto growing
	 *
	 * @private
	 */
	_autoGrowTextarea() {
		this.$input.style.height = 'auto';
		this.$input.style.height = `${this.$input.scrollHeight + 1}px`;
	}

	/**
	 * Call callback function after a certain delay
	 *
	 * @param callback
	 * @param delay
	 * @returns {function(...[*]=)}
	 */
	_debounce(callback, delay) {
		let timer;
		return function () {
			let args    = arguments,
			    context = this;

			clearTimeout(timer);
			timer = setTimeout(() => callback.apply(context, args), delay);
		};
	};

	/**
	 * Submit the form if it's valid
	 * Click on the submit button if it isn't (to display browser default error messages)
	 *
	 * @private
	 */
	_submitForm() {
		if (!this.$form.checkValidity()) {
			this.$form.querySelector('[type="submit"]').click();
		} else {
			this.$form.submit();
		}
	}

	/**
	 * Get form that handle this field
	 *
	 * @param current
	 * @returns {HTMLFormElement|boolean}
	 * @private
	 */
	_getForm(current) {
		current = current.parentElement;
		if (current.constructor === HTMLFormElement) return current;
		if (current.constructor === HTMLBodyElement) return false;
		return this._getForm(current);
	}

	/**
	 * Get template for the shadow DOM
	 *
	 * @returns {HTMLTemplateElement}
	 * @private
	 */
	_getTemplate() {
		const template = document.createElement('template');
		template.innerHTML = `
			${this._getStyle()}
			${this._getInnerContent()}
		`;
		return template;
	}

	/**
	 * Cache DOM elements
	 *
	 * @private
	 */
	_cacheDOM() {
		this.$container = this.shadowRoot;
		this.$form = this._getForm(this);
		this.$hiddenInput = document.querySelector(`.materialInput__hidden[name="${this.name}"]`);
		this.$input = this.$container.querySelector('.materialInput__input');
		this.$bar = this.$container.querySelector('.materialInput__bar');
	}

	/**
	 * - Attach the shadow DOM to handle the material input
	 * - Cache DOM elements
	 */
	connectedCallback() {
		this.attachShadow({mode: 'open'});
		this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

		// Material input is connected
		this.dispatchEvent(new Event('connected'));
	}

	/**
	 * Throw exception if there is missing attributes
	 *
	 * @param {string[]} attributes required attributes of material input
	 * @private
	 */
	_handleAttributesExceptions(attributes) {
		attributes.map(attribute => {
			if (!this.getAttribute(attribute)) throw new MissingAttributeError(`You need to set a ${attribute} to the input.`);
		});
	}

	/**
	 * Throw exception if the type of the input isn't valid
	 *
	 * @param {string[]} types valid types handled by material input
	 * @private
	 */
	_handleTypesExceptions(types) {
		if (!types.includes(this.type)) throw new NotValidTypeError(`You need to set a valid type to the input. The type "${this.type}" is not valid or not supported.`);
	}

	/**
	 * Get mandatory attributes
	 *
	 * @returns {string[]} required attributes of material input
	 * @private
	 */
	_mandatoryAttributes() {
		return [
			'name',
			'type',
			'label'
		];
	}

	/**
	 * Get valid types attributes (supported by material input)
	 *
	 * @returns {string[]} valid types handled by material input
	 * @private
	 */
	_supportedTypes() {
		return [
			'text',
			'email',
			'textarea',
			'password',
			'number'
		];
	}

}

customElements.define('material-input', MaterialInput);