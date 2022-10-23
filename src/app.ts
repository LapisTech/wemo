interface ItemSelectElement extends HTMLElement {
	addItem(key: string, label?: string): boolean;
	removeItem(key: string): boolean;
	select(key?: string): boolean;
	setValidator(validator: (key: string) => Error | null): this;
	placeholder: string;
	create: boolean;
	readonly selectedValue: string;
	value: string;
	addEventListener(type: 'error', listener: (event: ItemSelectErrorEvent) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: 'create', listener: (event: ItemSelectChangeEvent) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: 'change', listener: (event: ItemSelectChangeEvent) => any, options?: boolean | AddEventListenerOptions): void;
}

interface ItemSelectErrorEvent extends CustomEvent {
	detail: Error;
}

interface ItemSelectChangeEvent extends CustomEvent {
	detail: string;
}

document.addEventListener('DOMContentLoaded', () => {
	customElements.define(
		'item-select',
		class extends HTMLElement implements ItemSelectElement {
			protected contents: HTMLElement;
			protected list: HTMLSelectElement;
			protected input: HTMLInputElement;
			protected validator: (key: string) => Error | null;

			constructor() {
				super();

				this.setValidator((key) => {
					if (!key) {
						return new Error('Empty.');
					}

					for (const option of this.list.options) {
						if (option.value === key) {
							return new Error('Exists key.');
						}
					}

					return null;
				});

				const style = document.createElement('style');
				style.innerHTML = [
					':host{display:block;}',
					':host > div{display:grid;grid-template-rows:1rem;}',
					'select,input{font-size:1rem;outline:none;box-sizing:border-box;border:none;background:transparent;background:var(--back);color:var(--front);}',
					'select{cursor:pointer;}',
					':host([create]) > div select{display:none}',
					':host(:not([create])) > div input{display:none}',
				].join('');

				this.contents = document.createElement('div');

				this.list = document.createElement('select');
				this.input = document.createElement('input');

				this.initSelect();
				this.initInput();

				this.contents.appendChild(this.list);
				this.contents.appendChild(this.input);

				const shadow = this.attachShadow({ mode: 'open' });
				shadow.appendChild(style);
				shadow.appendChild(this.contents);
			}

			protected initSelect() {
				const option = document.createElement('option');
				option.value = '';
				option.textContent = 'New item';
				this.list.appendChild(option);

				this.list.addEventListener('change', () => {
					const option = this.list.options[this.list.selectedIndex];
					if (option.value) {
						this.onChange(option.value);
					} else {
						this.dispatchEvent(new CustomEvent('change', { detail: '' }));
						this.create = true;
						this.input.focus();
					}
				});

				this.list.addEventListener('select', () => {
					console.log('aaa');
				});
			}

			protected initInput() {
				this.input.placeholder = this.placeholder;

				let enter = false;
				this.input.addEventListener('keydown', (event) => {
					if (event.key !== 'Enter') {
						return;
					}
					enter = true;
					this.onChangeName();
				});
				this.input.addEventListener('blur', () => {
					if (enter) {
						enter = false;
						return;
					}
					if (!this.input.value) {
						this.create = false;
						this.list.selectedIndex = -1;
					}
					this.onChangeName();
				});
			}

			protected onChange(key: string) {
				this.dispatchEvent(new CustomEvent('change', { detail: key }));
			}

			protected onChangeName() {
				const key = this.input.value;
				const error = this.validator(key);

				if (error) {
					this.dispatchEvent(new CustomEvent('error', <ItemSelectErrorEvent> { detail: error }));
					return '';
				}

				this.dispatchEvent(new CustomEvent('create', { detail: key }));

				return key;
			}

			public addItem(key: string, label?: string) {
				if (!key) {
					return false;
				}

				for (const option of this.list.options) {
					if (option.value === key) {
						return false;
					}
				}

				const option = document.createElement('option');
				option.value = key;
				option.textContent = label || key;
				this.list.insertBefore(option, this.list.options[0]);
				option.selected = true;
				this.create = false;

				return true;
			}

			public removeItem(key: string) {
				if (!key) {
					return false;
				}

				for (const option of this.list.options) {
					if (option.value === key) {
						this.list.removeChild(option);
						return true;
					}
				}

				return false;
			}

			public select(key?: string) {
				if (key) {
					for (const option of this.list.options) {
						if (option.value === key) {
							option.selected = true;
							this.create = false;
							return true;
						}
					}
				}

				this.list.options[this.list.options.length - 1].selected = true;
				this.create = true;

				return !key;
			}

			public setValidator(validator: (key: string) => Error | null) {
				this.validator = validator;
				return this;
			}

			get placeholder() {
				return this.getAttribute('placeholder') || 'New item';
			}

			set placeholder(value) {
				if (!value) {
					this.removeAttribute('placeholder');
				} else {
					this.setAttribute('placeholder', value);
				}
				this.input.placeholder = this.placeholder;
			}

			get create() {
				return this.hasAttribute('create');
			}

			set create(value) {
				if (!value) {
					this.input.value = '';
					this.removeAttribute('create');
				} else {
					this.setAttribute('create', '');
				}
			}

			get selectedValue() {
				return this.list.selectedIndex < 0 ? '' : this.list.options[this.list.selectedIndex].value;
			}

			get value() {
				return this.create ? this.input.value : this.list.options[this.list.selectedIndex].value;
			}

			set value(value) {
				if (!this.create) {
					return;
				}
				this.input.value = value;
			}

			static get observedAttributes() {
				return ['placeholder'];
			}

			public attributeChangedCallback(attrName: string, oldVal: any, newVal: any) {
				if (oldVal === newVal) {
					return;
				}
				this.placeholder = newVal;
			}
		},
	);
});

class WemoStorage {
	get def() {
		return '-default';
	}

	get latest() {
		const key = localStorage.getItem('-latest');
		if (key && !this.exists(key)) {
			return this.def;
		}
		return key || this.def;
	}

	set latest(key) {
		if (key) {
			localStorage.setItem('-latest', key);
		} else {
			localStorage.removeItem('-latest');
		}
	}

	public all() {
		return Object.keys(localStorage).filter((key) => {
			return !key.match(/^-/);
		});
	}

	public exists(key: string) {
		return typeof localStorage.getItem(key) === 'string';
	}

	public has(key: string) {
		return !!localStorage.getItem(key);
	}

	public key(key?: string) {
		if (!key || key === this.def) {
			key = this.def;
		} else {
			key = key.replace(/^-+/, '');
		}
		return key;
	}

	public load(key?: string) {
		key = this.key(key);
		console.log(`Event: load(${key})`);
		this.latest = key;
		return localStorage.getItem(key) || '';
	}

	public save(key?: string, value?: string) {
		key = this.key(key);
		console.log(`Event: save(${key})`);
		localStorage.setItem(key, value || '');
		this.latest = key;
	}

	public remove(key?: string) {
		key = this.key(key);
		localStorage.removeItem(key);
	}
}

class EmptyError extends Error {
	constructor(message?: any) {
		super(message || 'Empty.');
		this.name = 'EmptyError';
	}
}

class InvalidTitleError extends Error {
	constructor(message?: any) {
		super(message || 'Begin "-".');
		this.name = 'InvalidTitleError';
	}
}

class ExistsError extends Error {
	protected title: string;
	constructor(message?: any) {
		super(message || 'Exists.');
		this.name = 'ExistsError';
	}
	public setTitle(title: string) {
		this.title = title;
		return this;
	}
	public getTitle() {
		return this.title;
	}
}

class App {
	protected storage: WemoStorage;
	protected itemSelect: ItemSelectElement;
	protected textarea: HTMLTextAreaElement;
	protected saved: HTMLElement;

	constructor(
		storage: WemoStorage,
		itemSelect: ItemSelectElement,
		textarea: HTMLTextAreaElement,
		saved: HTMLElement,
	) {
		this.storage = storage;
		this.itemSelect = itemSelect;
		this.textarea = textarea;
		this.saved = saved;

		let latest = '';
		this.storage.all().forEach((key) => {
			itemSelect.addItem(key);
			latest = key;
		});

		itemSelect.setValidator((key) => {
			if (!key) {
				return new EmptyError();
			}

			if (key.match(/^-/)) {
				return new InvalidTitleError();
			}

			if (this.storage.has(key)) {
				return new ExistsError().setTitle(key);
			}

			return null;
		});

		itemSelect.addEventListener('error', (event) => {
			const error = event.detail;
			console.error(error);
			if (error instanceof ExistsError) {
				const key = error.getTitle();
				//confirm(`Note "${key}" exists.\nDiscard current note?`)
				alert(`"${key}" exists.`);
				this.textarea.focus();
			}
		});

		itemSelect.addEventListener('create', (event) => {
			const key = event.detail;
			//this.storage.save(key, textarea.value);
			itemSelect.addItem(key);
			itemSelect.select(key);
			this.save();
			this.storage.remove();
		});

		itemSelect.addEventListener('change', (event) => {
			this.load();
		});

		itemSelect.select(this.storage.latest);

		const autoSave = (() => {
			let timer = 0;
			return () => {
				if (timer) {
					clearTimeout(timer);
				}
				timer = setTimeout(() => {
					this.save();
				}, 3000);
			};
		})();
		textarea.addEventListener('input', () => {
			autoSave();
		});

		if (this.storage.latest !== this.storage.def) {
			if (this.storage.exists(this.storage.latest)) {
				this.itemSelect.select(this.storage.latest);
			} else if (latest) {
				this.itemSelect.select(latest);
			}
		} else if (latest && !this.storage.exists(this.storage.latest)) {
			this.itemSelect.select(latest);
		}

		this.load();
	}

	protected save() {
		this.saved.classList.add('open');
		const key = this.itemSelect.selectedValue;
		this.storage.save(key, this.textarea.value);
		setTimeout(() => {
			this.saved.classList.remove('open');
		}, 2000);
	}

	protected load() {
		const key = this.storage.key(this.itemSelect.selectedValue);
		this.textarea.value = this.storage.load(key);
	}
}

class Config {
	protected storage: WemoStorage;
	protected list: HTMLElement;

	constructor(
		storage: WemoStorage,
		menu: HTMLButtonElement,
		config: HTMLDialogElement,
		lineBreak: HTMLButtonElement,
		sw: HTMLButtonElement,
		list: HTMLElement,
	) {
		this.storage = storage;
		this.list = list;

		Config.setLineBreak();

		menu.addEventListener('click', () => {
			this.reset();
			config.showModal();
		});

		config.addEventListener('click', () => {
			config.close();
		});

		(<HTMLElement> config.querySelector('div')).addEventListener('click', (event) => {
			event.stopPropagation();
		});

		document.querySelectorAll('#mode button').forEach((button: HTMLButtonElement) => {
			button.addEventListener('click', () => {
				const mode = <string> button.dataset.mode;
				if (mode === 'default') {
					localStorage.removeItem('-mode');
				} else {
					localStorage.setItem('-mode', mode);
				}
				Config.setMode();
			});
		});

		lineBreak.addEventListener('click', () => {
			if (document.body.classList.contains('disablelinebreak')) {
				localStorage.removeItem('-linebreak');
			} else {
				localStorage.setItem('-linebreak', 'disable');
			}
			Config.setLineBreak();
		});

		sw.addEventListener('click', () => {
			if (document.body.classList.contains('disablesw')) {
				ServiceWorkerManager.disable();
				ServiceWorkerManager.unregister();
			} else {
				ServiceWorkerManager.enable();
			}
			Config.setServiceWorker();
		});
	}

	protected reset() {
		this.list.innerHTML = '';
		const list = this.storage.all();

		for (const key of list) {
			const button = document.createElement('button');
			button.addEventListener('click', () => {
				this.deleteItem(key);
			});
			const li = document.createElement('li');
			li.dataset.key = key;
			li.textContent = key;
			li.appendChild(button);
			this.list.appendChild(li);
		}
	}

	protected deleteItem(key: string) {
		const item = this.list.querySelector(`li[data-key="${key}"]`);
		if (item && confirm(`Delete memo "${key}" ?`)) {
			this.list.removeChild(item);
			this.storage.remove(key);
		}
	}

	static setMode() {
		document.body.dataset.mode = localStorage.getItem('-mode') || '';
	}

	static setLineBreak() {
		document.body.classList[localStorage.getItem('-linebreak') ? 'add' : 'remove']('disablelinebreak');
	}

	static setServiceWorker() {
		document.body.classList[!ServiceWorkerManager.isEnable() ? 'add' : 'remove']('disablesw');
	}

	static init() {
		this.setMode();
		this.setServiceWorker();
		if ('orientation' in window) {
			document.body.classList.add('sp');
		}
	}
}

class ServiceWorkerManager {
	static enable() {
		localStorage.removeItem('-sw:disable');
	}

	static disable() {
		localStorage.setItem('-sw:disable', 'true');
	}

	static toggle() {
		if (this.disableUser()) {
			// Disable -> Enable.
			this.enable();
		} else {
			// Enable -> Disable.
			this.disable();
		}

		return !this.disableUser();
	}

	static isEnable() {
		return location.protocol === 'https:' &&
			this.disableUser() &&
			'serviceWorker' in navigator;
	}

	static disableUser() {
		return localStorage.getItem('-sw:disable') !== null;
	}

	static registered() {
		if (!this.isEnable()) {
			return Promise.reject(new Error('Cannot register ServiceWorker.'));
		}

		return navigator.serviceWorker.getRegistrations().then((registrations) => {
			if (0 < registrations.length) {
				return Promise.resolve();
			}
			return Promise.reject(new Error('Unregister ServiceWorker.'));
		});
	}

	static register() {
		if (this.isEnable()) {
			return navigator.serviceWorker.register('/sw.js');
		}
		return Promise.reject(new Error('Cannot register ServiceWorker.'));
	}

	static async unregister() {
		if (!this.isEnable()) {
			return Promise.reject(new Error('Cannot register ServiceWorker.'));
		}

		await navigator.serviceWorker.getRegistrations().then((registrations) => {
			let count = 0;
			for (const registration of registrations) {
				registration.unregister();
				++count;
			}
			console.log(`Unregister ServiceWorker(${count})`);
		});
		await caches.keys().then(function (keys) {
			return Promise.all(keys.map((cacheName) => {
				if (cacheName) {
					console.log(`Delete cache: ${cacheName}`);
					return caches.delete(cacheName);
				}
				return Promise.resolve();
			})).then(() => {
				console.log('Delete caches complete!');
			}).catch((error) => {
				console.error(error);
			});
		});
	}
}

customElements.whenDefined('item-select').then(() => {
	const storage = new WemoStorage();
	const sw = new ServiceWorkerManager();
	const app = new App(
		storage,
		<ItemSelectElement> document.getElementById('name'),
		<HTMLTextAreaElement> document.getElementById('memo'),
		<HTMLElement> document.getElementById('saved'),
	);
	const config = new Config(
		storage,
		<HTMLButtonElement> document.getElementById('menu'),
		<HTMLDialogElement> document.getElementById('config'),
		<HTMLButtonElement> document.getElementById('linebreak'),
		<HTMLButtonElement> document.getElementById('sw'),
		<HTMLUListElement> document.getElementById('list'),
	);
	ServiceWorkerManager.register();
});
