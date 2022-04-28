let ValueButton = document.querySelector('.form-donates__value');
let TypeButton = document.querySelector('.form-donates__type-donates');
let inputDonate = document.querySelector('#value-donate-front');
let inputDonateValue = document.querySelector('#value-donate');
let errorMessage = document.querySelector('#donate-error-message');
let buttonSend = document.querySelector('.form-donates__button');
let confirmDonate = document.querySelector('.checkbox-confirm-donate');
let typeDonateCheck = document.querySelector('#type_donate_check');
let filter = {
    acceptNode(node) {
        return (node.tagName.toLowerCase() == "div" && node.className.includes("form-donates__element")) ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_SKIP;
    }
};
let iteratorValue = document.createNodeIterator(ValueButton, NodeFilter.SHOW_ELEMENT,
    filter, false);
let iteratorButton = document.createNodeIterator(TypeButton, NodeFilter.SHOW_ELEMENT,
    filter, false);
class InterfaceDOMValue {
    constructor(id, el, value) {
        this.id = id
        this.elementDom = el
        this.value = value
        this.active = (value == 500 || value == 'false') ? true : false
    }
    isActive() {
        dataForm.value = this.value
        inputDonateValue.value = this.value
        ObjectValue.ActiveElemets(this.id)
        errorMessage.style.visibility = "hidden"
        inputDonate.value = ""
        avtiveButton();
    }
}

class InterfaceDOMType extends InterfaceDOMValue {
    isActive() {
        dataForm.isRegular = (this.value === 'true')
        typeDonateCheck.checked = (this.value === 'true')
        ObjectType.ActiveElemets(this.id);
    }
}

function addRemoveActiveClass(objectElements) {
    objectElements.defValue.forEach(el => {
        if (el.active) {
            el.elementDom.classList.add("form-donates__element-active");
        } else el.elementDom.classList.remove("form-donates__element-active");
    })

}

class ElementObject {
    defValue = []
    ActiveElemets(id) {
        this.defValue.forEach(el => {
            el.active = (el.id == id) ? true : false;
            if (el.active) {
                el.elementDom.classList.add("form-donates__element-active");
            } else el.elementDom.classList.remove("form-donates__element-active");
        })
    }
}

class FormData {
    value = 500
    isRegular = false
    accept = false
    FullDataForm() {
        if (this.isValid()) {
            return {
                isRegular: this.isRegular,
                value: this.value
            }
        } else {
            console.log("Форма не валидна");
            return;
        }
    }
    isValid() {
        if (this.accept && parseInt(this.value) > 0) {
            return true
        } else {
            errorMessage.style.visibility = "visible"
            if (!this.accept) {
                errorMessage.innerText = "Необходимо принять соглашение."
            }
            if (!parseInt(this.value) > 0) {
                errorMessage.innerText = "Не указана сумма пожертвования или указана не корректно."
            }
            return false
        }
    }
}

let dataForm = new FormData
let ObjectValue = new ElementObject
let ObjectType = new ElementObject

function isValidForm(data) {
    if (data.accept && parseInt(data.value) > 0) {
        return true
    } else
        return false
}

function avtiveButton() {
    if (isValidForm(dataForm)) {
        buttonSend.disabled = false
    } else {
        buttonSend.disabled = true
    }
}

function createElementObject(objectElement, isTypeElemet = false) {
    if (isTypeElemet) {
        let elementDefaultType = iteratorButton.nextNode()
        for (let i = 0; i < 10; i++) {
            if (!elementDefaultType) {
                break
            }
            objectElement.defValue.push(new InterfaceDOMType(i, elementDefaultType, elementDefaultType.dataset.isRegular));
            elementDefaultType = iteratorButton.nextNode();
        }
    } else {
        let elementDefaultValue = iteratorValue.nextNode();
        for (let i = 0; i < 10; i++) {
            if (!elementDefaultValue) {
                break
            }
            objectElement.defValue.push(new InterfaceDOMValue(i, elementDefaultValue, parseInt(elementDefaultValue.dataset.defaultValue)));
            elementDefaultValue = iteratorValue.nextNode();

        }
    }
}

function addListnerAllElement(objectElement) {
    objectElement.defValue.forEach(el => {
        el.elementDom.addEventListener('click', el.isActive.bind(el));
    })
}

function checkedInput(ev) {
    dataForm.accept = ev.target.checked
    avtiveButton()
}

function getValueInput(ev) {
    if (isNaN(parseInt(ev.target.value))) {
        ev.target.value = ""
        dataForm.value = null
        console.log("Ошибка ввода суммы");
        ObjectValue.ActiveElemets(-1);
        avtiveButton()
        return;
    }
    if (parseInt(ev.target.value) > 0) {
        ev.target.value = parseInt(ev.target.value);
        dataForm.value = parseInt(ev.target.value);
        ObjectValue.ActiveElemets(-1);
        inputDonateValue.value = parseInt(ev.target.value);
        avtiveButton()
    } else {
        dataForm.value = 0
        console.log("Ошибка ввода суммы");
        ObjectValue.ActiveElemets(-1);
        avtiveButton()
    }

}

function sendForm() {
    

    let formValue = dataForm.FullDataForm()
    if (formValue) {
        // console.log(formValue);
        //ОТПРАВИТЬ formValue {isRegular: Boolean, value: integer}
    }
}

$('#donateForm').on('submit', function() {
    const userId = parseInt($('[name=userId]').val());
    const isRegular = ($('.form-donates__type-donates [data-is-regular="true"').hasClass('form-donates__element-active'));

    
    if (userId === 0 && isRegular) {
        $('a[href="#authorize"]').trigger('click');
        $('#formAuthHint').show();
        return false;
    }
})

confirmDonate.addEventListener('input', checkedInput);

inputDonate.addEventListener('input', getValueInput);
buttonSend.addEventListener('click', sendForm);
createElementObject(ObjectValue);
createElementObject(ObjectType, true);
addListnerAllElement(ObjectValue);
addListnerAllElement(ObjectType);
addRemoveActiveClass(ObjectValue);
addRemoveActiveClass(ObjectType); 