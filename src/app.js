document.addEventListener('DOMContentLoaded', () => {
    customElements.define('item-select', class extends HTMLElement {
        contents;
        list;
        input;
        validator;
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
        initSelect() {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'New item';
            this.list.appendChild(option);
            this.list.addEventListener('change', () => {
                const option = this.list.options[this.list.selectedIndex];
                if (option.value) {
                    this.onChange(option.value);
                }
                else {
                    this.dispatchEvent(new CustomEvent('change', { detail: '' }));
                    this.create = true;
                    this.input.focus();
                }
            });
            this.list.addEventListener('select', () => {
                console.log('aaa');
            });
        }
        initInput() {
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
        onChange(key) {
            this.dispatchEvent(new CustomEvent('change', { detail: key }));
        }
        onChangeName() {
            const key = this.input.value;
            const error = this.validator(key);
            if (error) {
                this.dispatchEvent(new CustomEvent('error', { detail: error }));
                return '';
            }
            this.dispatchEvent(new CustomEvent('create', { detail: key }));
            return key;
        }
        addItem(key, label) {
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
        removeItem(key) {
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
        select(key) {
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
        setValidator(validator) {
            this.validator = validator;
            return this;
        }
        get placeholder() {
            return this.getAttribute('placeholder') || 'New item';
        }
        set placeholder(value) {
            if (!value) {
                this.removeAttribute('placeholder');
            }
            else {
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
            }
            else {
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
        attributeChangedCallback(attrName, oldVal, newVal) {
            if (oldVal === newVal) {
                return;
            }
            this.placeholder = newVal;
        }
    });
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
        }
        else {
            localStorage.removeItem('-latest');
        }
    }
    all() {
        return Object.keys(localStorage).filter((key) => {
            return !key.match(/^-/);
        });
    }
    exists(key) {
        return typeof localStorage.getItem(key) === 'string';
    }
    has(key) {
        return !!localStorage.getItem(key);
    }
    key(key) {
        if (!key || key === this.def) {
            key = this.def;
        }
        else {
            key = key.replace(/^-+/, '');
        }
        return key;
    }
    load(key) {
        key = this.key(key);
        console.log(`Event: load(${key})`);
        this.latest = key;
        return localStorage.getItem(key) || '';
    }
    save(key, value) {
        key = this.key(key);
        console.log(`Event: save(${key})`);
        localStorage.setItem(key, value || '');
        this.latest = key;
    }
    remove(key) {
        key = this.key(key);
        localStorage.removeItem(key);
    }
}
class EmptyError extends Error {
    constructor(message) {
        super(message || 'Empty.');
        this.name = 'EmptyError';
    }
}
class InvalidTitleError extends Error {
    constructor(message) {
        super(message || 'Begin "-".');
        this.name = 'InvalidTitleError';
    }
}
class ExistsError extends Error {
    title;
    constructor(message) {
        super(message || 'Exists.');
        this.name = 'ExistsError';
    }
    setTitle(title) {
        this.title = title;
        return this;
    }
    getTitle() {
        return this.title;
    }
}
class App {
    storage;
    itemSelect;
    textarea;
    saved;
    constructor(storage, itemSelect, textarea, saved) {
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
                alert(`"${key}" exists.`);
                this.textarea.focus();
            }
        });
        itemSelect.addEventListener('create', (event) => {
            const key = event.detail;
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
            }
            else if (latest) {
                this.itemSelect.select(latest);
            }
        }
        else if (latest && !this.storage.exists(this.storage.latest)) {
            this.itemSelect.select(latest);
        }
        this.load();
    }
    save() {
        this.saved.classList.add('open');
        const key = this.itemSelect.selectedValue;
        this.storage.save(key, this.textarea.value);
        setTimeout(() => {
            this.saved.classList.remove('open');
        }, 2000);
    }
    load() {
        const key = this.storage.key(this.itemSelect.selectedValue);
        this.textarea.value = this.storage.load(key);
    }
}
class Config {
    storage;
    list;
    constructor(storage, menu, config, lineBreak, list) {
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
        config.querySelector('div').addEventListener('click', (event) => {
            event.stopPropagation();
        });
        document.querySelectorAll('#mode button').forEach((button) => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                if (mode === 'default') {
                    localStorage.removeItem('-mode');
                }
                else {
                    localStorage.setItem('-mode', mode);
                }
                Config.setMode();
            });
        });
        lineBreak.addEventListener('click', () => {
            if (document.body.classList.contains('disablelinebreak')) {
                localStorage.removeItem('-linebreak');
            }
            else {
                localStorage.setItem('-linebreak', 'disable');
            }
            Config.setLineBreak();
        });
    }
    reset() {
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
    deleteItem(key) {
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
}
customElements.whenDefined('item-select').then(() => {
    const storage = new WemoStorage();
    const app = new App(storage, document.getElementById('name'), document.getElementById('memo'), document.getElementById('saved'));
    const config = new Config(storage, document.getElementById('menu'), document.getElementById('config'), document.getElementById('linebreak'), document.getElementById('list'));
});
