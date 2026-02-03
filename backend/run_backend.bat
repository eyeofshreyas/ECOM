@echo off
title ECOM Backend
echo Starting Backend Server...
cd /d "%~dp0"
npm run dev || pause
