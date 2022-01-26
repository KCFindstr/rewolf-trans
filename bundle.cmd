@echo off
del /f /s /q node_modules >nul
npm i --only=prod && npm run build