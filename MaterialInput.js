/*!
 * MaterialInput 0.1.0
 * (c) 2020 Théo BENOIT
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
 * TODO : - Fix textarea jumping on click/focus
 */
class MaterialInput extends HTMLElement {

	constructor() {
		super();
		this._handleAttributesExceptions(this._mandatoryAttributes());
		this._handleTypesExceptions(this._supportedTypes());
		this.addEventListener('connected', () => {
			this._cacheDOM();
			this.$form.style.position = 'relative';
			this._insertHiddenInput();
		});
		this.addEventListener('hiddenInputConnected', () => {
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
		this.dispatchEvent(new CustomEvent('valueChanged', {
			detail: {
				value: value
			}
		}));
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
		const elementRect = this.$input.getBoundingClientRect();
		const targetRect = this.$form.getBoundingClientRect();

		//@formatter:off
		const style = `
			pointer-events: none; 
			margin:0; 
			padding: 0;
			border: 0; 
			height: ${elementRect.height}px;
			opacity: 0; 
			position: absolute;
			top: ${elementRect.top - targetRect.top}px;
			left: ${elementRect.left - targetRect.left}px
		`;
		//@formatter:on
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

		this.dispatchEvent(new Event('hiddenInputConnected'));
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
                	/* INPUT */
                	--materialInput__fontFamily: Arial, Helvetica, sans-serif;
                	--materialInput__fontColor: #9e9e9e;
                	--materialInput__fontLetterSpacing: 0;
                	--materialInput__fontWeight: 400;
                	
                	/* LABEL */
                	--materialInput__labelFontFamily: var(--materialInput__fontFamily);
                	--materialInput__labelFontColor: var(--materialInput__fontColor);
                	--materialInput__labelFontLetterSpacing: var(--materialInput__fontLetterSpacing);
                	--materialInput__labelFontWeight: var(--materialInput__fontWeight);
                	
                	/* ACTIVE LABEL */
                	--materialInput__labelActiveColor: #4285f4;
                	--materialInput__activeLabelYPos: 0;
                	
                	/* BORDER */
                	--materialInput__borderWidth: 1px;
                	--materialInput__borderColor: #9e9e9e;
                	--materialInput__borderColorActive: #4285f4;
                	
                	/* OTHER BORDERS */
                	--materialInput__borderTopWidth: 0px;
                	--materialInput__borderRightWidth: 0px;
                	--materialInput__borderLeftWidth: 0px;
                	
                	/* BORDER TRANSITION */
                	--materialInput__borderRemoveTransitionDelay: .3s;
                	--materialInput__borderRemoveTransition: cubic-bezier(0.4, 0, 0.2, 1);
                	--materialInput__borderAddTransitionDelay: .3s;
                	--materialInput__borderAddTransition: cubic-bezier(0.4, 0, 0.2, 1);
                	
                	/* PADDING TOP */
                	--materialInput__paddingTop: 0.6em; /* If you want to remove this, you need to set to 0em */
                	
                	/* INPUT STYLE */
                	--materialInput__inputBackgroundColor: transparent;
                	--materialInput__inputBorderRadius: 0;
                	--materialInput__inputBoxShadow: none;
                	
                	/* INPUT STYLE ACTIVE */
                	--materialInput__activeInputBackgroundColor: var(--materialInput__inputBackgroundColor);
                	
                	/* INPUT PADDINGS */
                	--materialInput__inputPaddingTop: 0em;
                	--materialInput__inputPaddingRight: 0em;
                	--materialInput__inputPaddingBottom: 0.4em;
                	--materialInput__inputPaddingLeft: 0em;
                	
                	/* LABEL ADJUSTMENT */
                	--materialInput__labelTop: 0px;
                	
                	/* LABEL MARGIN WHEN NOT ACTIVE */
                	--materialInput__labelMarginLeft: var(--materialInput__inputPaddingLeft);
                	--materialInput__labelMarginRight: var(--materialInput__inputPaddingRight);
                	
                	/* LABEL MARGIN WHEN ACTIVE */
                	--materialInput__activeLabelMarginLeft: var(--materialInput__labelMarginLeft);
                	--materialInput__activeLabelMarginRight: var(--materialInput__labelMarginRight);
                	
               		/* BAR DISPLAY */
               		--materialInput__barDisplay: block;
                }
                
				.materialInput {
                	padding-top: calc(var(--materialInput__paddingTopUpper, 0.9em) + var(--materialInput__paddingTop)); /* 0.9em is the minimum for padding top (to have the label upper user input) */
                }
                
                .materialInput__input {
                	font-family: var(--materialInput__fontFamily);
                	-webkit-appearance: none;
                	   -moz-appearance: none;
                	        appearance: none;
                	-webkit-box-sizing: border-box;
                	        box-sizing: border-box;
                	resize: none;
                	outline: none;
				    position: relative;
				    min-height: var(--materialInput__inputMinHeight, auto);
				    background-color: var(--materialInput__inputBackgroundColor);
				    font-size: 1em;
				    font-weight: var(--materialInput__fontWeight);
				    line-height: 1;
				    letter-spacing: var(--materialInput__fontLetterSpacing);
				    color: var(--materialInput__fontColor);
				    padding: var(--materialInput__inputPaddingTop) var(--materialInput__inputPaddingRight) var(--materialInput__inputPaddingBottom) var(--materialInput__inputPaddingLeft); 
				    display: block;
				    width: 100%;
				    border-top: none;
				    border-right: none;
				    border-left: none;
				    -o-border-image: initial;
				       border-image: initial;
				    border-top: var(--materialInput__borderTopWidth) solid var(--materialInput__borderColor);
				    border-right: var(--materialInput__borderRightWidth) solid var(--materialInput__borderColor);
				    border-bottom: var(--materialInput__borderWidth) solid var(--materialInput__borderColor);
				    border-left: var(--materialInput__borderLeftWidth) solid var(--materialInput__borderColor);
				    -webkit-box-shadow: var(--materialInput__inputBoxShadow);
            			box-shadow: var(--materialInput__inputBoxShadow);
					border-radius: var(--materialInput__inputBorderRadius);
					word-break: initial;
					-webkit-transition: border-color .3s ease, background-color .3s ease;
					-o-transition: border-color .3s ease, background-color .3s ease;
					transition: border-color .3s ease, background-color .3s ease;
                }
                
                .materialInput__input::-webkit-input-placeholder {
                	font-family: var(--materialInput__fontFamily);
                	font-weight: var(--materialInput__fontWeight);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                .materialInput__input::-moz-placeholder {
                	font-family: var(--materialInput__fontFamily);
                	font-weight: var(--materialInput__fontWeight);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                .materialInput__input:-ms-input-placeholder {
                	font-family: var(--materialInput__fontFamily);
                	font-weight: var(--materialInput__fontWeight);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                .materialInput__input::-ms-input-placeholder {
                	font-family: var(--materialInput__fontFamily);
                	font-weight: var(--materialInput__fontWeight);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                .materialInput__input::placeholder {
                	font-family: var(--materialInput__fontFamily);
                	font-weight: var(--materialInput__fontWeight);
				    font-size: 1em;
                	line-height: 1;
				    color: var(--materialInput__fontColor);
				    letter-spacing: var(--materialInput__fontLetterSpacing);
                }
                
                textarea.materialInput__input {
                	padding-bottom: calc(var(--materialInput__inputPaddingBottom) + 0.125em); /* 0.125em more for textarea to have the same height of others inputs */
                }
      
                label {
                	font-family: var(--materialInput__labelFontFamily);
                	color: var(--materialInput__labelFontColor);
					pointer-events: none;
					position: absolute;
					z-index: 1;
					font-size: 1em;
					font-weight: var(--materialInput__labelFontWeight);
					letter-spacing: var(--materialInput__labelFontLetterSpacing);
					top: var(--materialInput__labelTop);
					-webkit-transform: translate3d(var(--materialInput__inputPaddingLeft), calc(var(--materialInput__paddingTopUpper, 0.9em) + var(--materialInput__paddingTop) + var(--materialInput__inputPaddingTop)), 0);
        				transform: translate3d(var(--materialInput__inputPaddingLeft), calc(var(--materialInput__paddingTopUpper, 0.9em) + var(--materialInput__paddingTop) + var(--materialInput__inputPaddingTop)), 0);
					text-align: initial;
					-webkit-transform-origin: 0 100%;
					    -ms-transform-origin: 0 100%;
					        transform-origin: 0 100%;
					will-change: transform, color;
					transition: transform .2s ease-out, color .2s ease-out, -webkit-transform .2s ease-out;
                }
                
                .materialInput__bar {
                	display: var(--materialInput__barDisplay);
				    -webkit-transform: scaleX(0);
				        -ms-transform: scaleX(0);
				            transform: scaleX(0);
				    background-color: var(--materialInput__borderColorActive);
				    height: calc(var(--materialInput__borderWidth) + 1px);
				    left: 0;
				    bottom: 0;
				    margin: calc(var(--materialInput__borderWidth) * -1) 0 0;
				    padding: 0;
				    position: absolute;
				    width: 100%;
                }
                
                :host([is-initialized]) .materialInput__bar,
                :host([is-initialized="true"]) .materialInput__bar {
                	-webkit-animation: materialInputBarRemoveUnderline var(--materialInput__borderRemoveTransitionDelay) var(--materialInput__borderRemoveTransition);
                	        animation: materialInputBarRemoveUnderline var(--materialInput__borderRemoveTransitionDelay) var(--materialInput__borderRemoveTransition);
                }
                
                :host([is-focused]) .materialInput__bar,
                :host([is-focused="true"]) .materialInput__bar {
                	-webkit-animation: materialInputBarAddUnderline var(--materialInput__borderAddTransitionDelay) var(--materialInput__borderAddTransition);
                	        animation: materialInputBarAddUnderline var(--materialInput__borderAddTransitionDelay) var(--materialInput__borderAddTransition);
					-webkit-transform: scaleX(1);
					    -ms-transform: scaleX(1);
					        transform: scaleX(1);
                }
                
                :host([is-focused]) label,
                :host([is-focused="true"]) label {
                	color: var(--materialInput__labelActiveColor);
                	-webkit-transform: translate3d(var(--materialInput__activeLabelMarginLeft), var(--materialInput__activeLabelYPos), 0) scale(0.8);
                	        transform: translate3d(var(--materialInput__activeLabelMarginLeft), var(--materialInput__activeLabelYPos), 0) scale(0.8);
				    -webkit-transform-origin: 0 0;
				        -ms-transform-origin: 0 0;
				            transform-origin: 0 0;
                }
                
                :host([value]) label,
                :host([placeholder]) label {
                	-webkit-transform: translate3d(var(--materialInput__activeLabelMarginLeft), var(--materialInput__activeLabelYPos), 0) scale(0.8);
                	        transform: translate3d(var(--materialInput__activeLabelMarginLeft), var(--materialInput__activeLabelYPos), 0) scale(0.8);
				    -webkit-transform-origin: 0 0;
				        -ms-transform-origin: 0 0;
				            transform-origin: 0 0;
                }
                
                :host([value]) input,
                :host([placeholder]) input,
                :host([is-focused]) input,
                :host([is-focused="true"]) input,
                :host([value]) textarea,
                :host([placeholder]) textarea,
                :host([is-focused]) textarea,
                :host([is-focused="true"]) textarea {
                	background-color: var(--materialInput__activeInputBackgroundColor);
                }
                
                @-webkit-keyframes materialInputBarRemoveUnderline {
				    0% {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				        opacity: 1;
				    }
				    to {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				        opacity: 0;
				    }
				}
                
                @keyframes materialInputBarRemoveUnderline {
				    0% {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				        opacity: 1;
				    }
				    to {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				        opacity: 0;
				    }
				}
				
				@-webkit-keyframes materialInputBarAddUnderline {
				    0% {
				        -webkit-transform: scaleX(0);
				                transform: scaleX(0);
				    }
				    to {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				    }
				}
				
				@keyframes materialInputBarAddUnderline {
				    0% {
				        -webkit-transform: scaleX(0);
				                transform: scaleX(0);
				    }
				    to {
				        -webkit-transform: scaleX(1);
				                transform: scaleX(1);
				    }
				}
				
				/* Prevent iOS from zooming in on input fields */
				@supports (-webkit-touch-callout: none) {
				  :host {
					font-size: initial !important;
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
			<div class="materialInput">
				${$label}
				${$input}
				${$bar}
			</div>
		`;
	}

	/**
	 * Add events on the differents elements
	 *
	 * @private
	 */
	_handleEvents() {
		// Container events
		this.addEventListener('focusout', () => this.isFocused = false);
		window.addEventListener('click', () => {
			this.isFocused = false;
		});

		// Input events
		this.$input.addEventListener('focusin', () => {
			this.isInitialized = true;
			this.isFocused = true;
		});

		this.$input.addEventListener('click', e => {
			e.stopPropagation();
			const {left} = e.target.getBoundingClientRect();
			this.$bar.style.transformOrigin = `${e.clientX - left}px center`;
			this.isInitialized = true;
			this.isFocused = true;
		});

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
	 * Get input height
	 */
	getInputHeight() {
		return this.$input.getBoundingClientRect().height;
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
		if (!this.$form) return;
		const $submitButton = this.$form.querySelector('[type="submit"]');
		if (!this.$form.checkValidity() && $submitButton) {
			if ($submitButton) $submitButton.click();
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
		if (this.shadowRoot) return;
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