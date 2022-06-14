const scaleValue = document.querySelector('.scale-panel__value');
const gridSelection = document.querySelector('.settings-panel__select-grid');
const buttonCursorMove = document.querySelector('.tool-panel__item-button-moving');
const buttonFreeDrawing = document.querySelector('.tool-panel__item-button-free-drawing');
const figureSelection = document.querySelector('.settings-panel__grid-figure');
const toolPanelList = document.querySelector('.tool-panel__list');
const inputChangeColor = document.querySelector('.sub-tool-panel__item-list-color-selection > input');
const subToolPanel = inputChangeColor.closest('.sub-tool-panel__change-color');
const buttonNoGrid = document.querySelector('.grid-panel__item-no-grid');
const buttonUsualGrid = document.querySelector('.grid-panel__item-usual-grid');
const buttonTriangularGrid = document.querySelector('.grid-panel__item-triangular-grid');
const buttonText = document.querySelector('.tool-panel__item-button-text');
const textSettings = document.querySelector('.text-settings');

const buttonClearBoard = document.querySelector('.logo-menu__item-clear-board');

let isDown = false;
let canvasCenter;



let selectedButton = buttonFreeDrawing;
buttonFreeDrawing.classList.add('settings-panel__button_active');

const handleClickOpenInputChangeColor = () => {
    subToolPanel.classList.add('sub-tool-panel_visible');
}
const handleClickCloseInputChangeColor = (event) => {
    if (event.target !== inputChangeColor) {
        subToolPanel.classList.remove('sub-tool-panel_visible');
    } else if(event.target !== fontColorInput) {
        fontColorListWrapper.classList.remive('active');
    } else {

    }
}


import {
    hideTextEditPanel
} from './scripts/add-text.js';



window.addEventListener('click', handleClickCloseInputChangeColor);
inputChangeColor.addEventListener('click', handleClickOpenInputChangeColor);

const socket = io();
const canvas = new fabric.Canvas(document.getElementById('canvasId'), {
        fireMiddleClick: true,
        isDrawingMode: true,
    },
);

let isRendering = false;
const render = canvas.renderAll.bind(canvas);

canvas.renderAll = () => {
    if (!isRendering) {
        isRendering = true;
        requestAnimationFrame(() => {
            render();
            isRendering = false;
        });
    }
};

// fabric.util.requestAnimFrame(function render() {
//     canvas.renderAll();
//     fabric.util.requestAnimFrame(render);
// });

const pathUsualGrid = "./images/grids/usual-grid.svg";
const pathTriangularGrid = "./images/grids/triangular-grid.svg";

const MAX_ZOOM_IN = 4;
const MAX_ZOOM_OUT = 0.05;
const SCALE_STEP = 0.05;

let currentRadiusCursor = 10;
let currentValueZoom = 1;

scaleValue.textContent = currentValueZoom * 100 + '%';

canvas.freeDrawingBrush.width = 5;
canvas.freeDrawingBrush.color = '#00aeff';

let isCursorMove = false;

let canvasCenterLeft;
let canvasCenterTop;

let apparentDistanceX;
let apparentDistanceY;


const rect = new fabric.Rect({
    width: 50,
    height: 50,
    fill: 'red',
    left: 0,
    top: 0,
})

canvas.add(rect);

const resizeCanvas = () => {
    canvas.setHeight(window.innerHeight);
    canvas.setWidth(window.innerWidth);
    apparentDistanceX = window.innerWidth/2;
    apparentDistanceY = window.innerHeight/2;
    canvasCenter = canvas.getCenter();
    canvasCenterLeft = canvasCenter.left;
    canvasCenterTop = canvasCenter.top;
    rect.set({
        left: canvasCenterLeft - 25,
        top: canvasCenterTop - 25,
    })
    canvas.renderAll();
}   

resizeCanvas();

fabric.Canvas.prototype.toggleDragMode = function () {
    const STATE_IDLE = "idle";
    const STATE_PANNING = "panning";
    // Remember the previous X and Y coordinates for delta calculations
    let lastClientX;
    let lastClientY;
    // Keep track of the state
    let deltaX;
    let deltaY;

    let state = STATE_IDLE;
    // We're entering dragmode
    if (isCursorMove) {
        console.log('isDrawingMode = true');
        this.off('mouse:move');
        // Discard any active object
        canvas.discardActiveObject();
        // Set the cursor to 'move'
        this.defaultCursor = "move";
        // Loop over all objects and disable events / selectable. We remember its value in a temp variable stored on each object
        this.forEachObject(function (object) {
            object.prevEvented = object.evented;
            object.prevSelectable = object.selectable;
            object.evented = false;
            object.selectable = false;
        });
        // Remove selection ability on the canvas
        this.selection = false;
        // // When MouseUp fires, we set the state to idle
        this.on("mouse:up", function (e) {
            state = STATE_IDLE;

        });
        // // When MouseDown fires, we set the state to panning
        this.on("mouse:down", (e) => {
            state = STATE_PANNING;
            lastClientX = e.e.clientX;
            lastClientY = e.e.clientY;
        });
        // When the mouse moves, and we're panning (mouse down), we continue
        this.on("mouse:move", (e) => {
            if (state === STATE_PANNING && e && e.e) {
                // let delta = new fabric.Point(e.e.movementX, e.e.movementY); // No Safari support for movementX and movementY
                // For cross-browser compatibility, I had to manually keep track of the delta
                // console.log(e.e)
                // Calculate deltas

                if (lastClientX) {
                    deltaX = e.e.clientX - lastClientX; // смещение по оси X
                                                        // (если вниз передвигаемся, то
                                                        // это значение уменьшается иначе увеличивается)
                    
                    if(currentValueZoom !== 1){
                        canvasCenterLeft = canvasCenterLeft - deltaX / currentValueZoom;
                    } else {
                        canvasCenterLeft = canvasCenterLeft - deltaX;
                    }
                    apparentDistanceX = canvasCenterLeft + window.innerWidth/2;
                    rect.set('left', canvasCenterLeft - 25)
                    // console.log('deltaX', canvasCenter.left)
                }
                if (lastClientY) {
                    deltaY = e.e.clientY - lastClientY; // смещение по оси Y
                                                        // (если влево передвигаемся, то
                                                        // это значение увеличивается иначе уменьшается)
                    if(currentValueZoom !== 1){
                        canvasCenterTop = canvasCenterTop - deltaY / currentValueZoom;
                    } else {
                        canvasCenterTop -= deltaY;
                    }
                    apparentDistanceY = canvasCenterTop + window.innerHeight/2;
                    rect.set('top', canvasCenterTop - 25)
                    // console.log('deltaY', canvasCenter.top)
                }
                // Update the last X and Y values
                // console.log('canvasCenter', { left: canvasCenter.left, top: canvasCenter.top })
                lastClientX = e.e.clientX;
                lastClientY = e.e.clientY;
                let delta = new fabric.Point(deltaX, deltaY);
                this.relativePan(delta);
                // this.trigger("moved");
            }
        });
    } else {
        // console.log(canvasCenter);
        // When we exit dragmode, we restore the previous values on all objects
        this.forEachObject(function (object) {
            object.evented = object.prevEvented !== undefined ? object.prevEvented : object.evented;
            object.selectable = object.prevSelectable !== undefined ? object.prevSelectable : object.selectable;
        });
        // Reset the cursor
        this.defaultCursor = "default";
        // Remove the event listeners
        this.off("mouse:up");
        this.off("mouse:down");
        this.off("mouse:move");
        removeEvents();
        // Restore selection ability on the canvas
        canvas.renderAll();
        this.selection = true;
    }
};                                                                     // Панорамирование

// canvas.toObject = (function (toObject) {
//     return function () {
//         return fabric.util.object.extend(toObject.call(this), {
//             id: this.id
//         })
//     }

// })(canvas.toObject)

const cursorUser = new fabric.Circle({              // Представление курсора
    radius: currentRadiusCursor,
    fill: 'red',
    left: -10,
    top: -10,
    originX: 'center',
    originY: 'center',
});

// ------------ Функции ------------

const removeEvents = () => {
    canvas.selection = false;
    canvas.off('mouse:down');
    canvas.off('mouse:up');
    canvas.off('mouse:move');
    canvas.on("mouse:move", (event) => handleMouseMovement(event))
}                                                   // Удаление слушателей события mouse:down, mouse:up, 
                                                    // mouse:move + selection = false;
const handleMouseMovement = (event) => {
    const cursorCoordinate = canvas.getPointer(event.e);
    let data = {
        userId: socket.id,
        coords: cursorCoordinate,
    }
    socket.emit('cursor-data', data);
}                                                   // Курсор

                                                    // Установка холста на весь экран
const handleClearCanvas = () => {
    canvas.clear();
    socket.emit('canvas:clear');
}                                                   // Очиста холста
const handleCreateNewLine = (event) => {
    event.path.set();
    // newLine.id = canvas.size() - 1;
    socket.emit('new-picture', JSON.stringify(event.path))
}                                                   // Создание новой линии
const handleMouseWheel = (opt) => {
    const delta = opt.e.deltaY;
    handleScale(delta);
    scaleValue.textContent = (currentValueZoom * 100).toFixed(0) + '%';
    const center = canvas.getCenter();
    const centerPoint = new fabric.Point(center.left, center.top);
    canvas.zoomToPoint(centerPoint, currentValueZoom);
 
    opt.e.preventDefault();
    opt.e.stopPropagation();
}                                                   // Масштабирование
const handleScale = (delta) => {
    if(delta < 0) {
        if(currentValueZoom <= MAX_ZOOM_OUT) return;
        // console.log(canvas.getWidth() * currentValueZoom, canvas.getHeight() * currentValueZoom)
        // apparentDistanceX = apparentDistanceX + 
        currentValueZoom = (parseFloat(currentValueZoom) - SCALE_STEP).toFixed(2);
        // apparentDistanceX = apparentDistanceX + apparentDistanceX * SCALE_STEP;
        // apparentDistanceY = apparentDistanceY + apparentDistanceY * SCALE_STEP;
    } else {
        if(currentValueZoom >= MAX_ZOOM_IN) return;
        currentValueZoom = (parseFloat(currentValueZoom) + SCALE_STEP).toFixed(2);
        // apparentDistanceX = apparentDistanceX - apparentDistanceX * SCALE_STEP;
        // apparentDistanceY = apparentDistanceY- apparentDistanceY * SCALE_STEP;
    }
}                                                   // Вспомогательная функция для масштабирования
const handleGetAllPicture = (data) => {
    if(data) {
        let buffer = JSON.parse(data);
        fabric.util.enlivenObjects(buffer, function (objects) {
            const origRenderOnAddRemove = canvas.renderOnAddRemove;
            canvas.renderOnAddRemove = false;
            // let id = 0;
            objects.forEach(function (obj) {
                // obj.id = id
                canvas.add(obj)
                // id++;
            });
            canvas.renderOnAddRemove = origRenderOnAddRemove;
            canvas.renderAll();
        });
        // const objects = canvas.getObjects();
        // const selection = new fabric.ActiveSelection(objects, { canvas: canvas });
        // const widthGroups = selection.width;
        // const heightGroups = selection.height;
        // selection.center();
        // selection.scale(1);
        // selection.destroy();
        // const groupCenterCoordinates = selection.getCenterPoint();
        // const optimalScaleX = canvas.width / widthGroups;
        // const optimalScaleY = canvas.height / heightGroups;
        // console.log(optimalScaleX, optimalScaleY)
        // currentValueZoom = (optimalScaleX > optimalScaleY ?
        //     optimalScaleY >= 1 ? 1 : optimalScaleY
        //     :
        //     optimalScaleX >=1 ? 1 : optimalScaleY
        // )- 0.02;
        // canvas.zoomToPoint({ x:  groupCenterCoordinates.x, y: groupCenterCoordinates.y}, currentValueZoom);
        // scaleValue.textContent = (currentValueZoom * 100).toFixed(0) + '%';
    }

}                                                   // Первая загрузка всех сохранённых картинок
const getNewPicture = (data) => {
    const dar = JSON.parse(data.coords);
    if(data.id !== socket.id) {
        const newElement = new fabric.Object(dar);
        console.log('Загрузка одно объекта')
        fabric.util.enlivenObjects([newElement], function (objects) {
            objects.forEach(function (obj) {
                canvas.add(obj)
            });
            canvas.renderAll();
        });
    }
}                                                   // Получение новой картинки

let cursorCoordinateOtherUsers;

const getCursorData = (data) => {
    if(data.userId !== socket.id) {
        cursorCoordinateOtherUsers = data.cursorCoordinates;
        apparentDistanceX = window.innerWidth/2;
        apparentDistanceY = window.innerHeight/2;
        console.log('apparentDistance', apparentDistanceX, apparentDistanceY)
        // console.log('cursorCoordinateOtherUsers >', cursorCoordinateOtherUsers);
        // console.log('apparentDistanceX >', apparentDistanceX);
        // console.log('apparentDistanceY >', apparentDistanceY);
        //canvasCenterLeft
        canvas.add(cursorUser);
        // Math.round(Math.abs(data.cursorCoordinates.x - canvasCenterLeft)) < apparentDistanceX
        const center = canvas.getCenter();
        if (
            data.cursorCoordinates.x < (center.left + apparentDistanceX - currentRadiusCursor) && 
            data.cursorCoordinates.x > (center.left  - apparentDistanceX + currentRadiusCursor)
        ) {
            cursorUser.left = data.cursorCoordinates.x;
        }
        if (
            data.cursorCoordinates.y < (center.top + apparentDistanceY - currentRadiusCursor) && 
            data.cursorCoordinates.y > (center.top - apparentDistanceY + currentRadiusCursor)
        ) {
            cursorUser.top = data.cursorCoordinates.y;
        }
    
    }
    canvas.renderAll();
}                                                   // Получение координат курсора
const handleChangeResizeWindow = (event) => {
    event.preventDefault();
    resizeCanvas();
}                                                   // Растягивание холста на весь экран
const handleChangeActiveButton = (newActiveButton) => {
    let button = newActiveButton;
    selectedButton.classList.remove('settings-panel__button_active');
    if(button){
        selectedButton = button;
        selectedButton.classList.add('settings-panel__button_active');
    }
}                                                   // Смена выбранной кнопки на другую актинвую
const handleDownKeySpace = (event) => {
    if (event.code === 'Space' && !event.repeat && !isDown) {
        event.preventDefault();
        canvas.isDrawingMode = false;
        isCursorMove = true;
        canvas.toggleDragMode();
        handleChangeActiveButton(buttonCursorMove)

    }
}                                                   // Нажатие на пробел
const handleUpKeySpace = (event) => {
    if (event.code === 'Space' && !isDown) {
        isCursorMove = false;
        canvas.selection = true;
        event.preventDefault();
        canvas.toggleDragMode();
        handleChangeActiveButton();
        if(!isCursorMove) {
            document.body.addEventListener('keydown', handleDownKeySpace)
        }
    }
}                                                   // Отпускание пробела
const changeGridSelection = (event) => {
    if(event.target.value === 'triangular') {
        canvas.setBackgroundColor({ source: pathTriangularGrid }, canvas.renderAll.bind(canvas));
    } else {
        canvas.setBackgroundColor({ source: pathUsualGrid }, canvas.renderAll.bind(canvas));
    }
}                                                   // Смена сетки
const handleButtonCursorMoveClick = () => {
    removeEvents();
    isCursorMove = !isCursorMove;
    canvas.toggleDragMode();
    canvas.isDrawingMode = false;
}                                                   // Перемещение с помощью кнопки
const handleSelectedButton = (event) => {
    let currentButton = event.target.closest('.tool-panel__item-button');
    if(currentButton === null || currentButton === buttonText){
        return;
    } else if (selectedButton === currentButton) {
        selectedButton.classList.toggle('settings-panel__button_active');
    } else {
        currentButton.classList.toggle('settings-panel__button_active');
        if(selectedButton) {
            selectedButton.classList.remove('settings-panel__button_active');
        }
        selectedButton = currentButton;
    }
}                                                   // Подсветка выбранной кнопки
const handleDraw = () => {  
    isCursorMove = false;
    removeEvents();
    canvas.isDrawingMode = !canvas.isDrawingMode;
}                                                   // Разрешение рисования
const changeObjectSelection = (value) => {
    canvas.forEachObject(function (obj) {
        obj.selectable = value;
    });
    canvas.renderAll();
}                                                   // Функция разрешающая/запрещающая выбор элементов
const handleUsualGrid = () => {
    canvas.setBackgroundColor({
        source: pathUsualGrid,
        repeat: 'repeat',
        scaleX: 1,
        scaleY: 1
    }, canvas.renderAll.bind(canvas));
}                                                   // Функция, отображающая на холсте обычную сетку
const handleNoGrid = () => {
    canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas))
}                                                   // Функция, задающая режим без сетки
const handleTriangularGrid = () => {
    canvas.setBackgroundColor({
        source: pathTriangularGrid,
        repeat: 'repeat',
        scaleX: 1,
        scaleY: 1
    }, canvas.renderAll.bind(canvas));
}                                                   // Функция, отображающая треугольную сетку

// ------------ // ------------



// console.log('1', canvasCenter)

// console.log(canvasCenterLeft, canvasCenterTop)
handleUsualGrid();

canvas.on('mouse:move', handleMouseMovement);         // Отображение чужих курсоров
canvas.on('path:created',handleCreateNewLine);        // Добавление новой линии
canvas.on('mouse:wheel', handleMouseWheel);           // Реагируем на масштабирование


// let info = document.getElementById('info');

// canvas.on({
//     'touch:gesture': function() {
//       var text = document.createTextNode(' Gesture ');
//       info.insertBefore(text, info.firstChild);
//     },
//     'touch:drag': function() {
//       var text = document.createTextNode(' Dragging ');
//       info.insertBefore(text, info.firstChild);
//     },
//     'touch:orientation': function() {
//       var text = document.createTextNode(' Orientation ');
//       info.insertBefore(text, info.firstChild);
//     },
//     'touch:shake': function() {
//       var text = document.createTextNode(' Shaking ');
//       info.insertBefore(text, info.firstChild);
//     },
//     'touch:longpress': function() {
//       var text = document.createTextNode(' Longpress ');
//       info.insertBefore(text, info.firstChild);
//     }
//   });

let pausePanning;

  canvas.on({
    'touch:gesture': function(e) {
        if (e.e.touches && e.e.touches.length == 2) {
            pausePanning = true;
            var point = new fabric.Point(e.self.x, e.self.y);
            if (e.self.state == "start") {
                zoomStartScale = self.canvas.getZoom();
            }
            var delta = zoomStartScale * e.self.scale;
            self.canvas.zoomToPoint(point, delta);
            pausePanning = false;
        }
    },
    'object:selected': function() {
        pausePanning = true;
    },
    'selection:cleared': function() {
        pausePanning = false;
    },
    'touch:drag': function(e) {
        if (pausePanning == false && undefined != e.e.layerX && undefined != e.e.layerY) {
            currentX = e.e.layerX;
            currentY = e.e.layerY;
            xChange = currentX - lastX;
            yChange = currentY - lastY;

            if( (Math.abs(currentX - lastX) <= 50) && (Math.abs(currentY - lastY) <= 50)) {
                var delta = new fabric.Point(xChange, yChange);
                canvas.relativePan(delta);
            }

            lastX = e.e.layerX;
            lastY = e.e.layerY;
        }
    }
});

// Получаем какие-либо данные от сервера

socket.on('saveImg', handleGetAllPicture);            // первая загрузка всего сохранённого в файле
socket.on('cursor-data', getCursorData);              // отображаем курсоры чужих пользователей
socket.on('new-picture', getNewPicture);              // получаем новый рисунок, созданный другими пользователями


// Навешиваем слушатели событий на нужные нам элементы

window.addEventListener('resize', handleChangeResizeWindow, false);
window.addEventListener('mousemove', (event) => {
    // console.log(event)
})

document.body.addEventListener('keydown', handleDownKeySpace);
document.body.addEventListener('keyup', handleUpKeySpace);

// gridSelection.addEventListener('change', changeGridSelection);



const drawCircle = () => {
    let circle, isDown, origX, origY;
    console.log(canvas.__eventListeners)
    removeEvents();
    changeObjectSelection(false);
    console.log(canvas.__eventListeners)

    canvas.on('mouse:down', function(o) {

        console.log('mouse:down')
        isDown = true;
        const pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        circle = new fabric.Circle({
                left: pointer.x,
                top: pointer.y,
                radius: 1,
                fill: 'red',
                selectable: false,
                originX: 'center',
                originY: 'center'
            });
        canvas.add(circle);
        // socket.emit("circle:add", circle);
        // socket.emit("circle:add",circle);
    });
    canvas.on('mouse:move', function(o) {
        console.log('mouse:move')
        if (!isDown) return;
        let pointer = canvas.getPointer(o.e);
        circle.set({ radius: Math.abs(origX - pointer.x) });
        // socket.emit("circle:edit", circle);
        canvas.renderAll();
    });
    canvas.on('mouse:up', function(o) {
        console.log('mouse:up')
        isDown = false;
        circle.setCoords();
        removeEvents();
    });
}
const drawLine = () => {
    let line, isDown;
    removeEvents();
    changeObjectSelection(false);

    canvas.on('mouse:down', function(o) {
        isDown = true;
        let pointer = canvas.getPointer(o.e);
        let points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
            strokeWidth: '10',
            fill: 'red',
            // stroke: hexToRgbA(drawing_color_fill.value,drawing_figure_opacity.value),
            // strokeDashArray: [stroke_line, stroke_line],
            ///stroke: '#07ff11a3',
            originX: 'center',
            originY: 'center',
            selectable: false
        });
        canvas.add(line);
        // socket.emit("line:add",points);
        // console.log("line:add",points);
    });
    canvas.on('mouse:move', function(o) {
        if (!isDown) return;
        let pointer = canvas.getPointer(o.e);
        line.set({
            x2: pointer.x,
            y2: pointer.y
        });
        canvas.renderAll();
        // socket.emit("line:edit",{x1:line.x1,y1:line.y1,x2:line.x2,y2:line.y2});
        //socket.emit("line:edit",line);
        // console.log("line:edit",{x1:line.x1,y1:line.y1,x2:line.x2,y2:line.y2},line);
    });

    canvas.on('mouse:up', function(o) {
        isDown = false;
        line.setCoords();
        // socket.emit('canvas_save_to_json',canvas.toJSON());
    });
}
const handleDrawSquare = (element) => {
    switch (element) {
        case 'circle': drawCircle();
        case 'line': drawLine();
    }

}


buttonNoGrid.addEventListener('click', handleNoGrid);                        // Кнопка без сетки
buttonUsualGrid.addEventListener('click', handleUsualGrid);                  // Кнопка обычной сетки
buttonTriangularGrid.addEventListener('click', handleTriangularGrid);        // Кнопка треугольной сетки
buttonCursorMove.addEventListener('click', handleButtonCursorMoveClick);     // Кнопка перемещения
buttonFreeDrawing.addEventListener('click', handleDraw);                     // Кнопка свободного рисования
buttonClearBoard.addEventListener('click', handleClearCanvas);               // Кнопка отчистки холста
toolPanelList.addEventListener('click', handleSelectedButton);               // Панель, подсветка выбранной кнопки


// text.on('object:selected',() => {
//     console.log('text > selected')
// })
// text.hiddenTextarea.focus();
// text.on('changed', function(e) {
//     console.log('text:changed', e);
// });


let selectedFontFamily = "Open Sans";
let newFontSizeValue = 40;

const buttonFontFamily = document.querySelector('.setting-item__button-font-family');
const fontFamilyList = document.querySelector('.setting-item__font-family-list-wrapper');
const fontSizeValue = document.querySelector('.setting-item__font-size-value');
const fontColorInput = document.querySelector('.setting-item__input-font-color > input');
const fontColorListWrapper = document.querySelector('.setting-item__font-color-list-wrapper');
const currentListItemfontFamily = document.querySelector('.text-settings__font-item_active');

fontColorInput.addEventListener('click', () => { fontColorListWrapper.classList.add('active') })

fontColorInput.addEventListener('change', (e) => { canvas.getActiveObject().set("fill", e.target.value) })

let selectedFontFamilyItem = currentListItemfontFamily;

textSettings.addEventListener('click', (e) => {
    switch(e.target.tagName) {
        case "LI":
            if(e.target.classList.contains('setting-item__font-family-item')) {
                if(selectedFontFamilyItem === e.target) return;
                selectedFontFamilyItem.classList.remove('text-settings__font-item_active');
                selectedFontFamilyItem = e.target;
                selectedFontFamilyItem.classList.add('text-settings__font-item_active');
                selectedFontFamily = e.target.textContent;
                buttonFontFamily.textContent = e.target.textContent;
                canvas.getActiveObject().set('fontFamily', selectedFontFamily);
            } else if(e.target.classList.contains('setting-item__font-style-item')) {
                const text = canvas.getActiveObject();
                switch(+e.target.dataset.item) {
                    case 1: {
                        const currentFontWeight = getStyle(text,'fontWeight')
                        const newFontWeight = currentFontWeight === "bold" ? "normal" : "bold";
                        e.target.classList.toggle('text-settings__font-item_active')
                        canvas.getActiveObject().set("fontWeight", newFontWeight);
                        canvas.renderAll();
                        console.log('1');
                        return;
                    }
                    case 2: {
                        const currentFontStyle = getStyle(text,'fontStyle');
                        const newFontStyle = currentFontStyle === "italic" ? "normal" : "italic";
                        canvas.getActiveObject().set("fontStyle", newFontStyle);
                        e.target.classList.toggle('text-settings__font-item_active')
                        canvas.renderAll();
                        console.log('2');
                        return;
                    }
                    case 3: {
                        const currentUnderline = getStyle(text,'underline');
                        const newUnderline = !currentUnderline;
                        canvas.getActiveObject().set("underline", newUnderline);
                        e.target.classList.toggle('text-settings__font-item_active')
                        canvas.renderAll();
                        console.log('3');
                        return;
                    }
                    case 4: {
                        const currentLinethrough = getStyle(text,'linethrough');
                        const newLinethrough = !currentLinethrough
                        canvas.getActiveObject().set("linethrough", newLinethrough);
                        e.target.classList.toggle('text-settings__font-item_active')
                        canvas.renderAll();
                        console.log('4');
                        return;
                    }
                }
            }
            canvas.renderAll();
        case 'BUTTON':
            if(e.target.classList.contains('setting-item__button-font-size-down')){
                newFontSizeValue-=2;
                fontSizeValue.textContent = newFontSizeValue
                canvas.getActiveObject().set('fontSize', newFontSizeValue)

            } else if(e.target.classList.contains('setting-item__button-font-size-up')){
                newFontSizeValue+=2;
                fontSizeValue.textContent = newFontSizeValue
                canvas.getActiveObject().set('fontSize', newFontSizeValue)
            }
            canvas.renderAll();
        default:
            return

    }
    
})

const getStyle = (object, styleName) => object[styleName];

const onSelectionChanged = () => {
    changeObjectSelection(false);
    const obj = canvas.getActiveObject();
    if (obj.selectionStart>-1) {
      console.log(getStyle(obj,'fontSize'));
    }
}


canvas.on('text:selection:changed', onSelectionChanged);

const showTextEditPanel = () => {
    buttonText.classList.add('settings-panel__button_active');
    textSettings.classList.add('text-settings_active');
}

let pageX, pageY;

document.addEventListener('mousemove', (e) => {
    pageX = e.pageX;
    pageY = e.pageY;
}, false);



buttonText.addEventListener('click', () => {
    selectedButton.classList.remove('settings-panel__button_active');
    selectedButton = buttonText;
    removeEvents();
    console.log('buttonText > click');
    isDown = !isDown;
    let isEditing = false;
    let firstTouch = false;
    // let currentEditText;

    buttonText.classList.toggle('settings-panel__button_active');

    if(isDown) {
        changeObjectSelection(false);
        canvas.isDrawingMode = false;
        canvas.on('mouse:down', function(o) {
            if(!isEditing) {
                textSettings.classList.add('text-settings_active');
                console.log('mouse:down');
                const pointer = canvas.getPointer(o.e);
                const text = new fabric.IText('Tap and Type', { 
                    fontFamily: "Open Sans",
                    fontSize: newFontSizeValue,
                    left: pointer.x, 
                    top: pointer.y,
                    textDecoration: 'underline',
                    editable: true,
                })
                console.log(text);
                canvas.add(text);
                canvas.setActiveObject(text);
                text.enterEditing();
                text.selectAll();
                isEditing = text.isEditing;
            }

        });

        canvas.on('mouse:up', function(o) {
            console.log(o.target)
            if(o.target !== null){
                if(o.target.isType('i-text') && isEditing) {
                    console.log('IT IS TEXT!!!! - 1');
                }


                else {
                    if(!firstTouch) {
                        firstTouch = true;
                    } else {
                        console.log('NOT TEXT!!!! - 1');
                        hideTextEditPanel({removeEvents, changeObjectSelection});
                        isDown = false;
                        firstTouch = false;
                    }
                }
            } else {
                if(isEditing && !firstTouch) {
                    console.log('IT IS TEXT!!!! - 2')
                    firstTouch = true;

                } else {
                    console.log('NOT TEXT!!!! - 2');
                    hideTextEditPanel({removeEvents, changeObjectSelection});
                    isDown = false;
                    isEditing = false;
                }
                
            }
            console.log('mouse:upedwedwedeqw34r234r34r234r')
        });

    } else {
        canvas.isDrawingMode = false;
        textSettings.classList.remove('text-settings_active');
        changeObjectSelection(true);
        removeEvents();
    }
})

canvas.on('text:editing:entered', (o) => {
    console.log('text:editing:entered')
    showTextEditPanel();
    // console.log(o.target)
    isDown = true;
    document.body.addEventListener('keyup', (e) => {
        if(e.code === 'Escape') {
            hideTextEditPanel({removeEvents, changeObjectSelection});   
            isDown = false;
        }
    }, { once: true })
    canvas.on('mouse:down', function(o) {
        console.log('mouse:up')
        if(o.target === null ? true : !o.target.isType('i-text')){
            hideTextEditPanel({removeEvents, changeObjectSelection});
            isDown = false;
        }
    });
});




