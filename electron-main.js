const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// .env 로드 (server.js보다 먼저)
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

// Express 서버 시작
const server = require('./server.js');

let mainWindow;

// 서버가 준비될 때까지 대기
function waitForServer(callback) {
  http.get('http://localhost:3000', () => {
    callback();
  }).on('error', () => {
    setTimeout(() => waitForServer(callback), 300);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    title: 'CircuitLab',
    show: false,
  });

  waitForServer(() => {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// 앱 종료 시 Express 서버 명시적으로 닫아 포트 해제
app.on('before-quit', () => {
  server.close();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
