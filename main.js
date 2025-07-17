import * as PIXI from './pixi.min.mjs';

class BlockBlastEditor {
    constructor() {
        this.app = null;
        this.backgroundSprite = null;
        this.boardData = [];
        this.gridSprites = [];
        this.selectedNumber = 0;
        this.gridSize = 8;
        this.cellSize = 45;
        this.gridStartX = 20;
        this.gridStartY = 20;
        this.originType = 'bottom-left'; // 默认为左下角
        this.wallpaperOpacity = 1.0; // 默认壁纸透明度为100%
        this.interfaceOpacity = 0.95; // 默认主界面透明度为95%
        this.chessboardBgOpacity = 0.90; // 默认棋盘背景透明度为90%
        this.gridOpacity = 0.90; // 默认网格透明度为90%
        this.controlsOpacity = 0.95; // 默认控制器透明度为95%
        this.textAreaOpacity = 0.95; // 默认文本区域透明度为95%
        this.blurStrength = 10; // 默认毛玻璃强度为10px
        this.enableBlur = true; // 默认启用毛玻璃效果
    }
    
    async init() {
        this.initBoard();
        await this.initPixi();
        this.createGrid();
        this.initEventListeners();
        this.updateTextarea(); // 初始化时更新文本框
        
        // 确保在PixiJS初始化后应用透明度设置
        this.applyInitialOpacitySettings();
    }
    
    // 初始化棋盘数据
    initBoard() {
        this.boardData = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.boardData[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.boardData[row][col] = 0;
            }
        }
    }
    
    // 初始化PixiJS应用
    async initPixi() {
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.gridSize * this.cellSize + 40,
            height: this.gridSize * this.cellSize + 40,
            backgroundColor: 0xffffff,
            backgroundAlpha: 0, // 设置背景透明
            antialias: true
        });
        
        // 创建一个专门的背景Sprite来控制背景透明度
        this.backgroundSprite = new PIXI.Graphics();
        this.backgroundSprite.beginFill(0xffffff);
        this.backgroundSprite.drawRect(0, 0, this.gridSize * this.cellSize + 40, this.gridSize * this.cellSize + 40);
        this.backgroundSprite.endFill();
        this.backgroundSprite.alpha = this.chessboardBgOpacity;
        this.app.stage.addChildAt(this.backgroundSprite, 0); // 添加到最底层
        
        document.getElementById('gameCanvas').appendChild(this.app.view);
        
        // 禁用游戏区域的右键菜单
        this.app.view.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    // 创建网格
    createGrid() {
        this.gridSprites = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.gridSprites[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.createCell(row, col);
            }
        }
    }
    
    // 创建单个格子
    createCell(row, col) {
        const x = this.gridStartX + col * this.cellSize;
        const y = this.gridStartY + row * this.cellSize;
        
        // 创建格子背景
        const cellBg = new PIXI.Graphics();
        cellBg.beginFill(0xf0f0f0);
        cellBg.drawRect(0, 0, this.cellSize - 2, this.cellSize - 2);
        cellBg.endFill();
        
        // 添加边框
        cellBg.lineStyle(2, 0x333333);
        cellBg.drawRect(0, 0, this.cellSize - 2, this.cellSize - 2);
        
        cellBg.x = x;
        cellBg.y = y;
        cellBg.interactive = true;
        cellBg.buttonMode = true;
        
        // 创建数字文本
        const numberText = new PIXI.Text('0', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0x333333,
            fontWeight: 'bold'
        });
        
        numberText.anchor.set(0.5);
        numberText.x = x + this.cellSize / 2 - 1;
        numberText.y = y + this.cellSize / 2 - 1;
        
        // 点击事件
        cellBg.on('pointerdown', (event) => {
            const originalEvent = event.data.originalEvent || event.data;
            const button = originalEvent.button !== undefined ? originalEvent.button : 0;
            
            // 阻止右键上下文菜单
            if (button === 2) {
                event.preventDefault();
            }
            
            if (button === 0) {
                // 左键点击：使用选中的数字
                this.setCellNumber(row, col, this.selectedNumber);
            } else if (button === 2) {
                // 右键点击：直接设置为0
                this.setCellNumber(row, col, 0);
            }
        });
        
        // 防止右键菜单
        cellBg.on('rightdown', (event) => {
            event.preventDefault();
        });
        
        this.app.stage.addChild(cellBg);
        this.app.stage.addChild(numberText);
        
        this.gridSprites[row][col] = {
            background: cellBg,
            text: numberText
        };
        
        // 应用当前的透明度设置
        cellBg.alpha = this.gridOpacity;
        numberText.alpha = 1.0; // 文本保持完全不透明
    }
    
    // 设置格子数字
    setCellNumber(row, col, number) {
        this.boardData[row][col] = number;
        this.gridSprites[row][col].text.text = number.toString();
        
        // 根据数字设置不同的颜色
        const colors = {
            0: 0x333333,
            1: 0xff0000,
            2: 0x00ff00,
            3: 0x0000ff,
            4: 0xffff00,
            5: 0xff00ff,
            6: 0x00ffff
        };
        
        this.gridSprites[row][col].text.style.fill = colors[number] || 0x333333;
        
        // 确保文本保持不透明
        this.gridSprites[row][col].text.alpha = 1.0;
        
        // 实时更新文本框
        this.updateTextarea();
    }
    
    // 重置棋盘
    resetBoard() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.setCellNumber(row, col, 0);
            }
        }
    }
    
    // 更新文本框内容
    updateTextarea() {
        // 根据选择的原点类型调整数组顺序
        let dataToExport;
        if (this.originType === 'top-left') {
            // 左上角原点：按原始顺序
            dataToExport = this.boardData;
        } else {
            // 左下角原点：需要反转行顺序
            dataToExport = [...this.boardData].reverse();
        }
        
        // 构建JavaScript数组格式的字符串
        let output = '[';
        for (let row = 0; row < this.gridSize; row++) {
            output += '[' + dataToExport[row].join(',') + ']';
            if (row < this.gridSize - 1) {
                output += ',';
            }
        }
        output += ']';
        
        document.getElementById('outputArea').value = output;
    }
    
    // 复制数据
    copyData() {
        const textareaContent = document.getElementById('outputArea').value;
        this.copyToClipboard(textareaContent);
    }
    
    // 导入数据
    importData() {
        const textareaContent = document.getElementById('outputArea').value.trim();
        
        // 验证数据
        const validationResult = this.validateData(textareaContent);
        if (!validationResult.valid) {
            this.showMessage(validationResult.message, 'error');
            return;
        }
        
        // 导入数据
        const importArray = validationResult.data;
        let boardData;
        
        if (this.originType === 'top-left') {
            // 左上角原点：按原始顺序
            boardData = importArray;
        } else {
            // 左下角原点：需要反转行顺序
            boardData = [...importArray].reverse();
        }
        
        // 更新棋盘数据和视图
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.boardData[row][col] = boardData[row][col];
                this.gridSprites[row][col].text.text = boardData[row][col].toString();
                
                // 根据数字设置不同的颜色
                const colors = {
                    0: 0x333333,
                    1: 0xff0000,
                    2: 0x00ff00,
                    3: 0x0000ff,
                    4: 0xffff00,
                    5: 0xff00ff,
                    6: 0x00ffff
                };
                
                this.gridSprites[row][col].text.style.fill = colors[boardData[row][col]] || 0x333333;
            }
        }
        
        this.showMessage('数据导入成功！', 'success');
    }
    
    // 验证数据格式
    validateData(data) {
        try {
            // 移除可能的分号
            const cleanData = data.replace(/;$/, '');
            
            // 尝试解析JSON
            const parsed = JSON.parse(cleanData);
            
            // 验证是否为数组
            if (!Array.isArray(parsed)) {
                return { valid: false, message: '数据格式错误：必须是数组格式' };
            }
            
            // 验证是否为8x8数组
            if (parsed.length !== 8) {
                return { valid: false, message: '数据格式错误：必须是8行数据' };
            }
            
            // 验证每行是否有8个元素，且元素范围正确
            for (let row = 0; row < parsed.length; row++) {
                if (!Array.isArray(parsed[row])) {
                    return { valid: false, message: `数据格式错误：第${row + 1}行不是数组` };
                }
                
                if (parsed[row].length !== 8) {
                    return { valid: false, message: `数据格式错误：第${row + 1}行必须有8个元素` };
                }
                
                for (let col = 0; col < parsed[row].length; col++) {
                    const value = parsed[row][col];
                    if (!Number.isInteger(value) || value < 0 || value > 6) {
                        return { valid: false, message: `数据格式错误：第${row + 1}行第${col + 1}列的值必须是0-6的整数` };
                    }
                }
            }
            
            return { valid: true, data: parsed };
            
        } catch (error) {
            return { valid: false, message: '数据格式错误：无法解析JSON格式' };
        }
    }
    
    // 显示临时消息
    showMessage(message, type) {
        const messageArea = document.getElementById('messageArea');
        messageArea.textContent = message;
        messageArea.className = `message-area message-${type}`;
        
        // 3秒后清除消息
        setTimeout(() => {
            messageArea.textContent = '';
            messageArea.className = 'message-area';
        }, 3000);
    }
    
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            // 尝试使用现代的Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                console.log('数据已自动复制到剪贴板');
            } else {
                // 回退到传统方法
                const textarea = document.getElementById('outputArea');
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                document.execCommand('copy');
                console.log('数据已自动复制到剪贴板');
            }
        } catch (err) {
            console.error('复制失败:', err);
            // 如果自动复制失败，至少选中文本让用户手动复制
            const textarea = document.getElementById('outputArea');
            textarea.select();
            textarea.setSelectionRange(0, 99999);
        }
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 数字选择器事件
        const numberButtons = document.querySelectorAll('.number-btn');
        numberButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有选中状态
                numberButtons.forEach(btn => btn.classList.remove('selected'));
                // 添加当前选中状态
                button.classList.add('selected');
                // 更新选中的数字
                this.selectedNumber = parseInt(button.dataset.number);
            });
        });
        
        // 重置按钮事件
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置棋盘吗？所有数据将被清空！')) {
                this.resetBoard();
            }
        });
        
        // 复制按钮事件
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyData();
        });
        
        // 导入按钮事件
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importData();
        });
        
        // 原点选择器事件
        const originRadios = document.querySelectorAll('input[name="origin"]');
        originRadios.forEach(radio => {
            radio.addEventListener('change', (event) => {
                this.originType = event.target.value;
                this.updateTextarea(); // 原点改变时更新文本框
            });
        });
        
        // 帮助提示点击事件
        this.initHelpTooltip();
        
        // 壁纸功能事件
        this.initWallpaperEvents();
    }
    
    // 初始化帮助提示功能
    initHelpTooltip() {
        const helpIcon = document.querySelector('.help-icon');
        const helpDropdown = document.querySelector('.help-dropdown');
        let isHelpVisible = false;
        
        // 点击切换显示/隐藏
        helpIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            isHelpVisible = !isHelpVisible;
            
            if (isHelpVisible) {
                helpDropdown.style.opacity = '1';
                helpDropdown.style.visibility = 'visible';
                helpDropdown.style.transform = 'translateY(0)';
            } else {
                helpDropdown.style.opacity = '0';
                helpDropdown.style.visibility = 'hidden';
                helpDropdown.style.transform = 'translateY(-10px)';
            }
        });
        
        // 点击其他地方隐藏帮助
        document.addEventListener('click', () => {
            if (isHelpVisible) {
                isHelpVisible = false;
                helpDropdown.style.opacity = '0';
                helpDropdown.style.visibility = 'hidden';
                helpDropdown.style.transform = 'translateY(-10px)';
            }
        });
        
        // 防止点击帮助内容时隐藏
        helpDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 初始化壁纸功能
    initWallpaperEvents() {
        // 加载本地存储的壁纸设置
        this.loadWallpaperSettings();
        
        // 上传壁纸按钮事件
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('wallpaperInput').click();
        });
        
        // 文件选择事件
        document.getElementById('wallpaperInput').addEventListener('change', (e) => {
            this.handleWallpaperUpload(e);
        });
        
        // 移除壁纸按钮事件
        document.getElementById('removeBtn').addEventListener('click', () => {
            this.removeWallpaper();
        });
        
        // 壁纸透明度滑块事件
        const opacitySlider = document.getElementById('opacitySlider');
        opacitySlider.addEventListener('input', (e) => {
            this.updateWallpaperOpacity(e.target.value);
        });
        
        // 界面透明度滑块事件
        const interfaceOpacitySlider = document.getElementById('interfaceOpacitySlider');
        interfaceOpacitySlider.addEventListener('input', (e) => {
            this.updateInterfaceOpacity(e.target.value);
        });
        
        // 棋盘背景透明度滑块事件
        const chessboardBgOpacitySlider = document.getElementById('chessboardBgOpacitySlider');
        chessboardBgOpacitySlider.addEventListener('input', (e) => {
            this.updateChessboardBgOpacity(e.target.value);
        });
        
        // 网格透明度滑块事件
        const gridOpacitySlider = document.getElementById('gridOpacitySlider');
        gridOpacitySlider.addEventListener('input', (e) => {
            this.updateGridOpacity(e.target.value);
        });
        
        // 控制器透明度滑块事件
        const controlsOpacitySlider = document.getElementById('controlsOpacitySlider');
        controlsOpacitySlider.addEventListener('input', (e) => {
            this.updateControlsOpacity(e.target.value);
        });
        
        // 文本区域透明度滑块事件
        const textAreaOpacitySlider = document.getElementById('textAreaOpacitySlider');
        textAreaOpacitySlider.addEventListener('input', (e) => {
            this.updateTextAreaOpacity(e.target.value);
        });
        
        // 毛玻璃强度滑块事件
        const blurSlider = document.getElementById('blurSlider');
        blurSlider.addEventListener('input', (e) => {
            this.updateBlurStrength(e.target.value);
        });
        
        // 毛玻璃效果开关事件
        const enableBlurCheckbox = document.getElementById('enableBlur');
        enableBlurCheckbox.addEventListener('change', (e) => {
            this.toggleBlurEffect(e.target.checked);
        });
        
        // 壁纸控制面板点击事件
        const wallpaperIcon = document.querySelector('.wallpaper-icon');
        const wallpaperDropdown = document.querySelector('.wallpaper-dropdown');
        let isWallpaperVisible = false;
        
        wallpaperIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            isWallpaperVisible = !isWallpaperVisible;
            
            if (isWallpaperVisible) {
                wallpaperDropdown.style.opacity = '1';
                wallpaperDropdown.style.visibility = 'visible';
                wallpaperDropdown.style.transform = 'translateY(0)';
            } else {
                wallpaperDropdown.style.opacity = '0';
                wallpaperDropdown.style.visibility = 'hidden';
                wallpaperDropdown.style.transform = 'translateY(-10px)';
            }
        });
        
        // 点击其他地方隐藏壁纸面板
        document.addEventListener('click', () => {
            if (isWallpaperVisible) {
                isWallpaperVisible = false;
                wallpaperDropdown.style.opacity = '0';
                wallpaperDropdown.style.visibility = 'hidden';
                wallpaperDropdown.style.transform = 'translateY(-10px)';
            }
        });
        
        // 防止点击壁纸面板时隐藏
        wallpaperDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 加载壁纸设置
    loadWallpaperSettings() {
        const savedWallpaper = localStorage.getItem('wallpaperImage');
        const savedOpacity = localStorage.getItem('wallpaperOpacity');
        const savedInterfaceOpacity = localStorage.getItem('interfaceOpacity');
        const savedChessboardBgOpacity = localStorage.getItem('chessboardBgOpacity');
        const savedGridOpacity = localStorage.getItem('gridOpacity');
        
        // 兼容性处理：如果存在旧的chessboardOpacity设置，将其迁移到新的设置
        const oldChessboardOpacity = localStorage.getItem('chessboardOpacity');
        if (oldChessboardOpacity && !savedChessboardBgOpacity && !savedGridOpacity) {
            // 将旧的设置同时应用到棋盘背景和网格
            localStorage.setItem('chessboardBgOpacity', oldChessboardOpacity);
            localStorage.setItem('gridOpacity', oldChessboardOpacity);
            localStorage.removeItem('chessboardOpacity'); // 移除旧设置
        }
        const savedControlsOpacity = localStorage.getItem('controlsOpacity');
        const savedTextAreaOpacity = localStorage.getItem('textAreaOpacity');
        const savedBlurStrength = localStorage.getItem('blurStrength');
        const savedEnableBlur = localStorage.getItem('enableBlur');
        
        if (savedWallpaper) {
            this.setWallpaperImage(savedWallpaper);
        }
        
        if (savedOpacity) {
            this.wallpaperOpacity = parseFloat(savedOpacity);
            const opacitySlider = document.getElementById('opacitySlider');
            opacitySlider.value = this.wallpaperOpacity * 100;
            this.updateWallpaperOpacity(this.wallpaperOpacity * 100);
        } else {
            // 设置默认壁纸透明度
            this.updateWallpaperOpacity(this.wallpaperOpacity * 100);
        }
        
        if (savedInterfaceOpacity) {
            this.interfaceOpacity = parseFloat(savedInterfaceOpacity);
            const interfaceOpacitySlider = document.getElementById('interfaceOpacitySlider');
            interfaceOpacitySlider.value = this.interfaceOpacity * 100;
            this.updateInterfaceOpacity(this.interfaceOpacity * 100);
        } else {
            // 设置默认界面透明度
            this.updateInterfaceOpacity(this.interfaceOpacity * 100);
        }
        
        // 兼容性处理后重新获取设置值
        const finalChessboardBgOpacity = localStorage.getItem('chessboardBgOpacity');
        const finalGridOpacity = localStorage.getItem('gridOpacity');
        
        if (finalChessboardBgOpacity) {
            this.chessboardBgOpacity = parseFloat(finalChessboardBgOpacity);
            const chessboardBgOpacitySlider = document.getElementById('chessboardBgOpacitySlider');
            chessboardBgOpacitySlider.value = this.chessboardBgOpacity * 100;
            // 如果背景Sprite已经创建，则应用透明度设置
            if (this.backgroundSprite) {
                this.updateChessboardBgOpacity(this.chessboardBgOpacity * 100);
            }
        } else {
            // 设置默认棋盘背景透明度
            if (this.backgroundSprite) {
                this.updateChessboardBgOpacity(this.chessboardBgOpacity * 100);
            }
        }
        
        if (finalGridOpacity) {
            this.gridOpacity = parseFloat(finalGridOpacity);
            const gridOpacitySlider = document.getElementById('gridOpacitySlider');
            gridOpacitySlider.value = this.gridOpacity * 100;
            // 如果棋盘格子已经初始化，则应用透明度设置
            if (this.gridSprites && this.gridSprites.length > 0) {
                this.updateGridOpacity(this.gridOpacity * 100);
            }
        } else {
            // 设置默认网格透明度
            if (this.gridSprites && this.gridSprites.length > 0) {
                this.updateGridOpacity(this.gridOpacity * 100);
            }
        }
        
        if (savedControlsOpacity) {
            this.controlsOpacity = parseFloat(savedControlsOpacity);
            const controlsOpacitySlider = document.getElementById('controlsOpacitySlider');
            controlsOpacitySlider.value = this.controlsOpacity * 100;
            this.updateControlsOpacity(this.controlsOpacity * 100);
        } else {
            // 设置默认控制器透明度
            this.updateControlsOpacity(this.controlsOpacity * 100);
        }
        
        if (savedTextAreaOpacity) {
            this.textAreaOpacity = parseFloat(savedTextAreaOpacity);
            const textAreaOpacitySlider = document.getElementById('textAreaOpacitySlider');
            textAreaOpacitySlider.value = this.textAreaOpacity * 100;
            this.updateTextAreaOpacity(this.textAreaOpacity * 100);
        } else {
            // 设置默认文本区域透明度
            this.updateTextAreaOpacity(this.textAreaOpacity * 100);
        }
        
        if (savedBlurStrength) {
            this.blurStrength = parseInt(savedBlurStrength);
            const blurSlider = document.getElementById('blurSlider');
            blurSlider.value = this.blurStrength;
            this.updateBlurStrength(this.blurStrength);
        } else {
            // 设置默认毛玻璃强度
            this.updateBlurStrength(this.blurStrength);
        }
        
        if (savedEnableBlur !== null) {
            this.enableBlur = savedEnableBlur === 'true';
            const enableBlurCheckbox = document.getElementById('enableBlur');
            enableBlurCheckbox.checked = this.enableBlur;
            this.toggleBlurEffect(this.enableBlur);
        } else {
            // 设置默认毛玻璃效果
            this.toggleBlurEffect(this.enableBlur);
        }
    }
    
    // 处理壁纸上传
    handleWallpaperUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }
        
        // 验证文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert('图片文件大小不能超过5MB！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.setWallpaperImage(imageData);
            this.saveWallpaperSettings(imageData);
        };
        reader.readAsDataURL(file);
    }
    
    // 设置壁纸图片
    setWallpaperImage(imageData) {
        const wallpaperBg = document.getElementById('wallpaperBackground');
        wallpaperBg.style.backgroundImage = `url(${imageData})`;
    }
    
    // 移除壁纸
    removeWallpaper() {
        const wallpaperBg = document.getElementById('wallpaperBackground');
        wallpaperBg.style.backgroundImage = 'none';
        localStorage.removeItem('wallpaperImage');
        
        // 重置壁纸透明度为100%
        this.wallpaperOpacity = 1.0;
        wallpaperBg.style.opacity = this.wallpaperOpacity;
        document.getElementById('opacitySlider').value = 100;
        document.getElementById('opacityValue').textContent = '100%';
        localStorage.setItem('wallpaperOpacity', this.wallpaperOpacity);
    }
    
    // 更新壁纸透明度
    updateWallpaperOpacity(value) {
        this.wallpaperOpacity = value / 100;
        const wallpaperBg = document.getElementById('wallpaperBackground');
        wallpaperBg.style.opacity = this.wallpaperOpacity;
        
        // 更新显示的透明度值
        document.getElementById('opacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('wallpaperOpacity', this.wallpaperOpacity);
    }
    
    // 更新界面透明度
    updateInterfaceOpacity(value) {
        this.interfaceOpacity = value / 100;
        const container = document.querySelector('.container');
        
        // 设置主容器背景透明度
        container.style.backgroundColor = `rgba(255, 255, 255, ${this.interfaceOpacity})`;
        
        // 更新毛玻璃效果
        this.updateBlurEffect();
        
        // 更新显示的透明度值
        document.getElementById('interfaceOpacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('interfaceOpacity', this.interfaceOpacity);
    }
    
    // 更新棋盘背景透明度
    updateChessboardBgOpacity(value) {
        this.chessboardBgOpacity = value / 100;
        
        // 设置背景Sprite的透明度
        if (this.backgroundSprite) {
            this.backgroundSprite.alpha = this.chessboardBgOpacity;
        }
        
        // 更新显示的透明度值
        document.getElementById('chessboardBgOpacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('chessboardBgOpacity', this.chessboardBgOpacity);
    }
    
    // 更新网格透明度
    updateGridOpacity(value) {
        this.gridOpacity = value / 100;
        
        // 设置每个格子背景的透明度，保持文本不透明
        if (this.gridSprites && this.gridSprites.length > 0) {
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.gridSprites[row] && this.gridSprites[row][col]) {
                        this.gridSprites[row][col].background.alpha = this.gridOpacity;
                        // 文本保持完全不透明
                        this.gridSprites[row][col].text.alpha = 1.0;
                    }
                }
            }
        }
        
        // 更新显示的透明度值
        document.getElementById('gridOpacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('gridOpacity', this.gridOpacity);
    }
    
    // 更新控制器透明度
    updateControlsOpacity(value) {
        this.controlsOpacity = value / 100;
        
        // 设置数字选择器背景透明度
        const numberButtons = document.querySelectorAll('.number-btn');
        numberButtons.forEach(btn => {
            btn.style.backgroundColor = `rgba(255, 255, 255, ${this.controlsOpacity})`;
        });
        
        // 设置原点选择器背景透明度
        const originSelector = document.querySelector('.origin-selector');
        if (originSelector) {
            originSelector.style.backgroundColor = `rgba(248, 249, 250, ${this.controlsOpacity})`;
        }
        
        // 设置操作按钮背景透明度
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            if (btn.classList.contains('reset-btn')) {
                btn.style.backgroundColor = `rgba(220, 53, 69, ${this.controlsOpacity})`;
            } else if (btn.classList.contains('copy-btn')) {
                btn.style.backgroundColor = `rgba(40, 167, 69, ${this.controlsOpacity})`;
            } else if (btn.classList.contains('import-btn')) {
                btn.style.backgroundColor = `rgba(23, 162, 184, ${this.controlsOpacity})`;
            }
        });
        
        // 更新显示的透明度值
        document.getElementById('controlsOpacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('controlsOpacity', this.controlsOpacity);
    }
    
    // 更新文本区域透明度
    updateTextAreaOpacity(value) {
        this.textAreaOpacity = value / 100;
        const outputArea = document.getElementById('outputArea');
        
        // 设置文本框背景透明度
        if (outputArea) {
            outputArea.style.backgroundColor = `rgba(255, 255, 255, ${this.textAreaOpacity})`;
        }
        
        // 更新显示的透明度值
        document.getElementById('textAreaOpacityValue').textContent = `${value}%`;
        
        // 保存透明度设置
        localStorage.setItem('textAreaOpacity', this.textAreaOpacity);
    }
    
    // 更新毛玻璃强度
    updateBlurStrength(value) {
        this.blurStrength = parseInt(value);
        
        // 更新显示的毛玻璃强度值
        document.getElementById('blurValue').textContent = `${value}px`;
        
        // 应用毛玻璃效果
        this.updateBlurEffect();
        
        // 保存毛玻璃强度设置
        localStorage.setItem('blurStrength', this.blurStrength);
    }
    
    // 切换毛玻璃效果开关
    toggleBlurEffect(enabled) {
        this.enableBlur = enabled;
        
        // 应用毛玻璃效果
        this.updateBlurEffect();
        
        // 保存毛玻璃效果开关设置
        localStorage.setItem('enableBlur', this.enableBlur);
    }
    
    // 更新毛玻璃效果
    updateBlurEffect() {
        const container = document.querySelector('.container');
        const helpDropdown = document.querySelector('.help-dropdown');
        const wallpaperDropdown = document.querySelector('.wallpaper-dropdown');
        
        let blurValue;
        if (this.enableBlur && this.blurStrength > 0) {
            blurValue = `blur(${this.blurStrength}px)`;
        } else {
            blurValue = 'blur(0px)';
        }
        
        container.style.backdropFilter = blurValue;
        if (helpDropdown) helpDropdown.style.backdropFilter = blurValue;
        if (wallpaperDropdown) wallpaperDropdown.style.backdropFilter = blurValue;
    }
    
    // 应用初始透明度设置
    applyInitialOpacitySettings() {
        // 确保棋盘背景透明度设置在背景Sprite创建后应用
        if (this.backgroundSprite) {
            this.updateChessboardBgOpacity(this.chessboardBgOpacity * 100);
        }
        
        // 确保网格透明度设置在PixiJS初始化后应用
        if (this.gridSprites && this.gridSprites.length > 0) {
            this.updateGridOpacity(this.gridOpacity * 100);
        }
    }
    
    // 保存壁纸设置
    saveWallpaperSettings(imageData) {
        localStorage.setItem('wallpaperImage', imageData);
        localStorage.setItem('wallpaperOpacity', this.wallpaperOpacity);
        localStorage.setItem('interfaceOpacity', this.interfaceOpacity);
        localStorage.setItem('chessboardBgOpacity', this.chessboardBgOpacity);
        localStorage.setItem('gridOpacity', this.gridOpacity);
        localStorage.setItem('controlsOpacity', this.controlsOpacity);
        localStorage.setItem('textAreaOpacity', this.textAreaOpacity);
        localStorage.setItem('blurStrength', this.blurStrength);
        localStorage.setItem('enableBlur', this.enableBlur);
    }
}

// 页面加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', async () => {
    const editor = new BlockBlastEditor();
    await editor.init();
});