const ENV = require('./ENV');
let om;


async function connect() {
    return await OM.connectAsync(ENV.HOST, ENV.WSS, ENV.TOKEN, ENV.MODEL_ID);
}

OM.web('userlist', async (request) => {
    if (!om) {
        om = await connect();
    }
    const data = await getUserNames(om);
    return JSON.stringify(data);
})

OM.web('todoList', async (request) => {
    if (!om) {
        om = await connect();
    }
    const userId = parseInt(request.query.id);
    const data = await getTodoList(om, userId);
    return JSON.stringify(data);
});

OM.web('sendTodo', async (request) => {
    if (!om) {
        om = await connect();
    }
    const text = Object.values(request.query);
    const data = await sendTodo(om, text);
    return JSON.stringify(data);

});

OM.web('setCheckBoxStatus', async (request) => {
    if (!om) {
        om = await connect();
    }
    const text = Object.values(request.query);
    const data = await setCheckBoxStatus(om, text);
    return JSON.stringify(data);
});

async function getUserNames(om) {
    const pivot = om.multicubes.multicubesTab().open('Todo-list').pivot('Todo-list Users');
    const grid = await pivot.createAsync();
    const users = [];
    for (const label of grid.range(0, -1, 0, 1).generator()) {
        const userRows = await label.rowsAsync();
        const userLabels = await userRows.allAsync()
        userLabels.forEach(userLabel => {
            let user = {};
            user.id = userLabel.first().longId();
            user.name = userLabel.first().label();
            users.push(user);
        });
    }
    return users;
}



async function getTodoList(om, userId) {
    const pivot = om.multicubes.multicubesTab().open('Todo-list').pivot('Todo-list Date').addDependentContext(userId);
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    const todoList = [];
    for (const chunk of generator) {
        const labels = await chunk.rowsAsync();
        const labelsGroup = await labels.allAsync();
        labelsGroup.forEach(listLabel => {
            let todoListPoint = {};
            const cellValues = [];
            todoListPoint.numId = listLabel.all()[1].longId();
            listLabel.cells().all().forEach(cell => {
                cellValues.push(cell.getValue());
            });
            if (cellValues[0] != '' && cellValues[1] != '') {
                todoListPoint.time = cellValues[0];
                todoListPoint.listLabel = cellValues[1];
                todoListPoint.checkButton = cellValues[2];
                todoListPoint.date = cellValues[3];
                todoList.push(todoListPoint);
            }
        });
    }
    return todoList;
    //кол-во строк
    // const fname = `SKU_${String(Date.now())}`;
    // const storageExporter = grid.storageExporter();
    // const storageExportResult = await storageExporter.exportAsync();
    // await storageExportResult.moveToLocalAsync(fname);
    // const localFileSystem = om.filesystems.local();
    // const filePath = localFileSystem.getPathObj(fname);
    // const fileManager = om.filesystems.filesDataManager();
    // const csvReader = fileManager.csvReader(filePath);
    // const generator = csvReader.generator();
    // return generator.length
}

async function sendTodo(om, text) {
    const userId = Number(text[0]);
    const todoListLabel = text[1];
    const date = text[2];
    const dateFilter = await getDayById(om, date);
    const time = text[3];
    const listValues = [time, todoListLabel];
    const pivot = om.multicubes.multicubesTab().open('Todo-list').pivot('Todo-list Input').addDependentContext(userId).addDependentContext(dateFilter);
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    if (generator.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator[0].rowsAsync();
        const labelGroup = await label.allAsync();
        for (const listLabel of labelGroup) {
            const cells = listLabel.cells().all();

            let isEmpty = false;
            for (const cell of cells) {
                isEmpty = cell.isEditable() && !cell.getValue();
            }
            if (isEmpty) {
                let index = 0;
                for (const cell of cells) {
                    cb.set(cell, listValues[index]);
                    index++;
                }
                await cb.applyAsync();
                return !cb.count();
            }
        }
    }
    return false;

}

async function setCheckBoxStatus(om, text) {
    const userId = Number(text[0]);
    const date = text[1];
    const dateFilter = await getDayById(om, date);
    const checkBoxId = Number(text[2]);
    const checkBoxStatus = text[3];
    // const listValues = [time, todoListLabel, checkBoxStatus];
    const pivot = om.multicubes.multicubesTab().open('Todo-list').pivot('Todo-list CheckBox').addDependentContext(userId).addDependentContext(dateFilter).rowsFilter(checkBoxId);
    const grid = await pivot.createAsync();
    const generator = grid.range().generator();
    if (generator.length) {
        const cb = om.common.createCellBuffer().canLoadCellsValues(false);
        const label = await generator[0].rowsAsync();
        const labelGroup = await label.allAsync();
        for (const listLabel of labelGroup) {
            const cell = listLabel.cells().first();
            cb.set(cell, checkBoxStatus);
            await cb.applyAsync();
            return !cb.count();
        }
    }
    return false;
};


async function getDaysElements(om) {
    const pivot = om.times.timePeriodTab('Days').pivot();
    const grid = await pivot.createAsync();
    const days = [];
    const generator = grid.range(0, -1, 0, 1).generator();
    for (const chunk of generator) {
        const daysRows = await chunk.rowsAsync();
        const daysLabels = await daysRows.allAsync();
        daysLabels.forEach(dayLabel => {
            let day = {};
            day.id = dayLabel.first().longId();
            day.name = dayLabel.first().label();
            days.push(day);
        });
    };
    return days;
};

async function getDayById(om, date) {
    const daysItems = await getDaysElements(om);
    const foundDay = daysItems.find(item => item.name === date);
    return foundDay.id;
};