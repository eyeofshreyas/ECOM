@echo off
title ECOM Frontend
echo Starting Frontend Server...
cd /d "%~dp0"
npm run dev || pause
