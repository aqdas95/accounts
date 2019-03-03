const { app, BrowserWindow, ipcMain } = require("electron")
const path = require('path');
const url = require('url');


app.on("ready", () => {
    let mainWindow = new BrowserWindow({ height: 800, width: 800, show: false })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/main.html'),
        protocol: 'file',
        slashes: true
    }));
    mainWindow.setFullScreen(true);
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
        console.log('MainEvent');
    });
    ipcMain.on('print', (event, args) => {
        mainWindow.webContents.print();
        console.log('MainEventPrint');
    })
});



app.on("window-all-closed", () => { app.quit() })