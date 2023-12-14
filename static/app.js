// после того как все элементы загрузились
document.addEventListener('DOMContentLoaded', async function () {
    await getUserList();
    console.log('Loading was done!');
});

async function getUserList() {
    const result = await fetch('./userlist');
    const resultJson = await result.json();
    const ListUsers = resultJson;
    for (user of ListUsers) {
        let newOption = new Option(user.name, user.id)
        mySelect.append(newOption)
    }
}

// селектор дней по-умолчанию
const daySelector = document.getElementById('selectDay');
const eventSelector = document.getElementById('eventDay');
const currentDay = new Date();
const year = currentDay.getFullYear();
const month = (currentDay.getMonth() + 1).toString().padStart(2, '0');
const day = currentDay.getDate().toString().padStart(2, '0');
const hour = currentDay.getHours().toString().length < 2 ? '0' + currentDay.getHours() : currentDay.getHours();
const minutes = currentDay.getMinutes().toString().length < 2 ? '0' + currentDay.getMinutes() : currentDay.getMinutes();
const defaultDay = `${day}.${month}.${year}`;
let selectedDay = defaultDay;


//Селектор пользователей
const filterUsers = document.getElementById('mySelect');
let filterUsersName = '';
let filterUsersId = '';
const workingScreen = document.querySelector('.working_screen');
let selectedUser = document.querySelector('#selectedUser')

// Выбор пользователя
filterUsers.addEventListener('change', async function () {
    workingScreen.style.display = "flex";
    filterUsersId = mySelect.value;
    filterUsersName = mySelect.options[mySelect.selectedIndex].text;
    selectedUser.innerHTML = filterUsersName;
    await getTodoList(filterUsersId);
    await getSelectedDay();
    await checkStatus();

})

// список задач из ОМ
let todoList = document.querySelector('.todo_list');
async function getTodoList(filterUsersId) {
    // event.preventDefault();
    const url = ('./todoList?' + new URLSearchParams({ id: filterUsersId }).toString());
    const result = await fetch(url);
    const resultJson = await result.json();
    const newTodoList = [];
    resultJson.forEach(item => newTodoList.push(item));
    await filterTodoList(newTodoList);
    datePicker(newTodoList);
}

async function filterTodoList(newTodoList) {
    todoList.innerHTML = '';
    newTodoList.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(":").map(Number);
        const [bHours, bMinutes] = b.time.split(":").map(Number);

        if (aHours < bHours) return -1;
        if (aHours > bHours) return 1;
        if (aMinutes < bMinutes) return -1;
        if (aMinutes > bMinutes) return 1;
    })
    for (item of newTodoList) {
        const toggleButtonCheck = document.createElement('button');
        item.checkButton === 'true' ? toggleButtonCheck.classList.add('toggle-button', 'active') : toggleButtonCheck.classList.add('toggle-button');
        const completeCheck = document.createElement('i');
        completeCheck.classList.add('fas', 'fa-check');
        toggleButtonCheck.append(completeCheck);
        appendCheckEvent(toggleButtonCheck);
        const newListItem = document.createElement('li');
        newListItem.style.display = 'none';
        const timeSpan = document.createElement('span');
        timeSpan.dataset.orderState = "new";
        timeSpan.textContent = `(${item.time})`;
        timeSpan.classList.add('time_span');
        const listItemText = document.createElement('div');
        listItemText.classList.add('list_item_text');
        listItemText.textContent = item.listLabel;
        newListItem.classList.add('list_item');
        newListItem.dataset.date = item.date;
        newListItem.dataset.num = item.numId;
        newListItem.prepend(toggleButtonCheck);
        newListItem.append(listItemText);
        newListItem.append(timeSpan);
        todoList.append(newListItem);
    }
}

// цвет иконки времени
async function checkStatus() {
    const listItems = document.querySelectorAll('.list_item');
    listItems.forEach(list => {
        let statusList = list.querySelector('.time_span');
        const listDate = list.dataset.date;
        const listDateFormat = listDate.split('.');
        const formattedDate = `${listDateFormat[2]}-${listDateFormat[1]}-${listDateFormat[0]}`;
        const matchResult = list.querySelector('.time_span').textContent.match(/\((\d{2}:\d{2})\)/);
        const listTime = matchResult ? matchResult[1] : null;
        const buttonStatus = list.querySelector('.toggle-button');
        const isActive = buttonStatus.classList.contains('active');
        const listDateTime = new Date(`${formattedDate}T${listTime}`)
        const dafaultDayFormat = defaultDay.split('.');
        const formattedDefaultDay = `${dafaultDayFormat[2]}-${dafaultDayFormat[1]}-${dafaultDayFormat[0]}`;
        const dateDefaultDay = new Date(`${formattedDefaultDay}T${hour}:${minutes}`);
        if (dateDefaultDay > listDateTime) {
            isActive === true ? statusList.dataset.orderState = 'new' : statusList.dataset.orderState = 'expired';
        } else {
            statusList.dataset.orderState = 'new';
        }
    });
};

// Date Picker
function datePicker(newTodoList) {
    $('#selectDay').daterangepicker({
        singleDatePicker: true,
        locale: {
            format: 'DD.MM.YYYY',
            cancelLabel: 'Отмена',
            applyLabel: 'Применить',
            "firstDay": 1,
        },
        startDate: defaultDay,
        isInvalidDate: function (date) {
            const todoDates = newTodoList.map(item => item.date);
            const todoCheckButton = newTodoList.filter(item => item.date === date.format('DD.MM.YYYY')).map(item => item.checkButton);
            if ($.inArray(date.format('DD.MM.YYYY'), todoDates) > -1 && $.inArray('false', todoCheckButton) == -1 ) {
                return true;
            } else {
                return false;
            }
        },
        isCustomDate: function (date) {
            const todoDates = newTodoList.map(item => item.date);
            if ($.inArray(date.format('DD.MM.YYYY'), todoDates) > -1) {
                return 'todoDates';
            } else {
                return false;
            }
        }
    });
    $('#selectDay').on('apply.daterangepicker', function (ev, picker) {
        selectedDay = picker.startDate.format('DD.MM.YYYY');
        getSelectedDay();
        // datePicker(newTodoList);
    });
    $('#eventDay').daterangepicker({
        singleDatePicker: true,
        locale: {
            format: 'DD.MM.YYYY',
            cancelLabel: 'Отмена',
            applyLabel: 'Применить',
            "firstDay": 1
        },
        startDate: defaultDay,
        "drops": "up",
    });
    $('#eventDay').on('apply.daterangepicker', function (ev, picker) {
        eventSelector.value = picker.startDate.format('DD.MM.YYYY');
        formatDate(eventSelector.value)
    });
};
// $(datePicker)

// jQuery Timepicker
$(document).ready(function () {
    $('input.timepicker').timepicker({
        timeFormat: 'HH:mm',
        defaultTime: '10:00', //
        interval: 10, // minutes
    });
});

// задачи на выбранный день
function getSelectedDay() {
    let todos = todoList.querySelectorAll('li');
    todos.forEach(todo => {
        const todoDate = todo.getAttribute('data-date');
        if (daySelector.value === todoDate) {
            todo.style.display = 'flex';
        } else {
            todo.style.display = 'none';
        }
    });
}

// действие чек-бокса

function appendCheckEvent(button) {
    button.addEventListener('click', async function (event) {
        event.preventDefault();
        event.currentTarget.classList.toggle('active');
        await checkStatus();
        const checkBoxNumId = button.parentElement.dataset.num;
        const checkButton = button.classList.contains('active');

        try {
            const url = ('./setCheckBoxStatus?' + new URLSearchParams({ userId: filterUsersId, date: formatDate(daySelector.value), checkBox: checkBoxNumId, checkBoxStatus: checkButton }).toString());
            const result = await fetch(url);
            if (!result.ok) {
                throw new Error(`Ответ от сервера: ${result.status} ${result.statusText}`)
            }
            const resultJson = await result.json();
            if (resultJson === false) {
                throw new Error('Получен результат false')
            }
            return resultJson;
        } catch (error) {
            console.error('Ошибка:', error.message);
            event.currentTarget.classList.toggle('active');
            // event.currentTarget.reset();
            throw error;
        }
    });
}

// действие кнопки "Создать"
document.querySelector('.todo_button').addEventListener('click', async function () {
    // event.preventDefault();
    const url = ('./sendTodo?' + new URLSearchParams({ id: filterUsersId, label: eventNewTodo.value, date: formatDate(eventDay.value), time: eventTime.value }).toString());
    const result = await fetch(url);
    const resultJson = await result.json();
    eventNewTodo.value = "";
    await getTodoList(filterUsersId);
    await getSelectedDay();
    await checkStatus();
    return resultJson;
});

// перевод в формат даты ОМ Days
function formatDate(date) {
    const parts = date.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const monthsNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const formattedDate = new Date(year, month, day);
    const formattedMonth = monthsNames[formattedDate.getMonth()];
    formattedYear = year.toString().slice(-2);
    return `${day} ${formattedMonth} ${formattedYear}`;
}
