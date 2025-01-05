// 全局变量
let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
const searchInput = document.getElementById('search');
const entriesList = document.getElementById('entriesList');
const journalForm = document.getElementById('journalForm');
let currentLang = localStorage.getItem('language') || 'zh';

// 多语言支持
const translations = {
    zh: {
        pageTitle: '我的随记',
        newEntry: '新建记录',
        location: '位置',
        category: '分类',
        content: '内容',
        reminder: '提醒时间',
        repeat: '重复提醒',
        important: '重要',
        cancel: '取消',
        save: '保存',
        search: '搜索内容...',
        allCategories: '所有分类',
        thoughts: '想法',
        travel: '旅行',
        work: '工作',
        daily: '每天',
        weekly: '每周',
        monthly: '每月',
        deleteConfirm: '确定要删除这条记录吗？',
        notificationTitle: '记录提醒'
    },
    en: {
        pageTitle: 'My Journal',
        newEntry: 'New Entry',
        location: 'Location',
        category: 'Category',
        content: 'Content',
        reminder: 'Reminder',
        repeat: 'Repeat',
        important: 'Important',
        cancel: 'Cancel',
        save: 'Save',
        search: 'Search content...',
        allCategories: 'All Categories',
        thoughts: 'Thoughts',
        travel: 'Travel',
        work: 'Work',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        deleteConfirm: 'Are you sure you want to delete this entry?',
        notificationTitle: 'Journal Reminder'
    }
};

// 语言切换功能
function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('language', currentLang);
    updateLanguage();
}

function updateLanguage() {
    // 更新页面标题
    document.getElementById('pageTitle').textContent = translations[currentLang].pageTitle;
    document.title = translations[currentLang].pageTitle;

    // 更新搜索框占位符
    searchInput.placeholder = translations[currentLang].search;

    // 更新分类选择器
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.options[0].text = translations[currentLang].allCategories;
    for (let i = 1; i < categoryFilter.options.length; i++) {
        const value = categoryFilter.options[i].value;
        categoryFilter.options[i].text = translations[currentLang][value];
    }

    // 更新所有使用 lang- 类的元素
    document.querySelectorAll('[class*="lang-"]').forEach(element => {
        const key = element.className.split('lang-')[1].split(' ')[0];
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });

    // 重新渲染条目列表以更新语言
    renderEntries();
}

// 表单显示/隐藏功能
function showNewEntryForm(isEdit = false) {
    document.getElementById('entryForm').classList.remove('hidden');
    if (!isEdit) {
        journalForm.reset();
        document.getElementById('entryId').value = '';
    }
}

function hideNewEntryForm() {
    document.getElementById('entryForm').classList.add('hidden');
    journalForm.reset();
    document.getElementById('entryId').value = '';
}

// 清除提醒时间
function clearReminder() {
    document.getElementById('reminderTime').value = '';
    document.getElementById('repeatReminder').checked = false;
    document.getElementById('repeatInterval').disabled = true;
}
// 位置功能
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const location = data.display_name.split(',').slice(0, 3).join(',');
                    document.getElementById('location').value = location;
                } catch (error) {
                    console.error('Error getting location:', error);
                    document.getElementById('location').value = `${latitude}, ${longitude}`;
                }
            },
            error => {
                console.error('Error getting location:', error);
                alert('无法获取位置信息。');
            }
        );
    } else {
        alert('您的浏览器不支持地理位置功能。');
    }
}

// 渲染条目列表
function renderEntries() {
    let filteredEntries = [...entries];
    
    // 应用搜索过滤
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredEntries = filteredEntries.filter(entry =>
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.location.toLowerCase().includes(searchTerm)
        );
    }

    // 应用分类过滤
    const categoryFilter = document.getElementById('categoryFilter').value;
    if (categoryFilter) {
        filteredEntries = filteredEntries.filter(entry => entry.category === categoryFilter);
    }

    // 应用日期过滤
    const dateFilter = document.getElementById('dateFilter').value;
    if (dateFilter) {
        filteredEntries = filteredEntries.filter(entry => 
            entry.timestamp.startsWith(dateFilter)
        );
    }

    // 渲染过滤后的条目
    entriesList.innerHTML = filteredEntries.map(entry => `
        <div class="bg-white rounded-lg shadow mb-4 p-6 ${entry.important ? 'border-l-4 border-red-500' : ''}">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <div class="text-sm text-gray-500 mb-1">
                        <i class="fas fa-location-dot mr-2"></i>${entry.location}
                    </div>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-tag mr-2"></i>${translations[currentLang][entry.category]}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editEntry('${entry.id}')" class="text-blue-500 hover:text-blue-600">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteEntry('${entry.id}')" class="text-red-500 hover:text-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="mb-4 whitespace-pre-wrap">${entry.content}</div>
            <div class="text-sm text-gray-500">
                ${new Date(entry.timestamp).toLocaleString()}
                ${entry.reminderTime ? `
                    <span class="ml-4">
                        <i class="fas fa-bell mr-1"></i>
                        ${new Date(entry.reminderTime).toLocaleString()}
                        ${entry.repeatInterval ? `(${translations[currentLang][entry.repeatInterval]})` : ''}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// 编辑条目
function editEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (entry) {
        document.getElementById('entryId').value = entry.id;
        document.getElementById('location').value = entry.location;
        document.getElementById('category').value = entry.category;
        document.getElementById('content').value = entry.content;
        document.getElementById('important').checked = entry.important;
        
        if (entry.reminderTime) {
            document.getElementById('reminderTime').value = new Date(entry.reminderTime)
                .toISOString().slice(0, 16);
            if (entry.repeatInterval) {
                document.getElementById('repeatReminder').checked = true;
                document.getElementById('repeatInterval').disabled = false;
                document.getElementById('repeatInterval').value = entry.repeatInterval;
            }
        }
        
        showNewEntryForm(true);
    }
}

// 删除条目
function deleteEntry(id) {
    if (confirm(translations[currentLang].deleteConfirm)) {
        const index = entries.findIndex(e => e.id === id);
        if (index !== -1) {
            // 如果存在提醒，清除它
            if (entries[index].timeoutId) {
                clearTimeout(entries[index].timeoutId);
            }
            entries.splice(index, 1);
            localStorage.setItem('journalEntries', JSON.stringify(entries));
            renderEntries();
        }
    }
}
// 提醒功能
function scheduleReminder(entry) {
    if (!entry.reminderTime) return;

    const reminderTime = new Date(entry.reminderTime).getTime();
    const now = new Date().getTime();
    
    if (reminderTime > now) {
        entry.timeoutId = setTimeout(() => {
            showNotification(entry);
            
            // 如果是重复提醒，安排下一次提醒
            if (entry.repeatInterval) {
                const nextReminder = new Date(reminderTime);
                switch (entry.repeatInterval) {
                    case 'daily':
                        nextReminder.setDate(nextReminder.getDate() + 1);
                        break;
                    case 'weekly':
                        nextReminder.setDate(nextReminder.getDate() + 7);
                        break;
                    case 'monthly':
                        nextReminder.setMonth(nextReminder.getMonth() + 1);
                        break;
                }
                entry.reminderTime = nextReminder.toISOString();
                scheduleReminder(entry);
                
                // 更新localStorage
                localStorage.setItem('journalEntries', JSON.stringify(entries));
            }
        }, reminderTime - now);
    }
}

// 显示通知
function showNotification(entry) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(translations[currentLang].notificationTitle, {
                body: entry.content,
                icon: '/path/to/icon.png' // 可以添加一个图标
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification(entry);
                }
            });
        }
    }
}

// 导入导出功能
document.getElementById('exportButton').addEventListener('click', () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal_entries.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('importInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedEntries = JSON.parse(e.target.result);
                entries = importedEntries;
                localStorage.setItem('journalEntries', JSON.stringify(entries));
                renderEntries();
                event.target.value = ''; // 清除input
                alert('导入成功！');
            } catch (error) {
                console.error('Import error:', error);
                alert('导入失败，请确保文件格式正确。');
            }
        };
        reader.readAsText(file);
    }
});

// 表单提交处理
journalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const entryId = document.getElementById('entryId').value;
    const entry = {
        id: entryId || Date.now().toString(),
        location: document.getElementById('location').value,
        category: document.getElementById('category').value,
        content: document.getElementById('content').value,
        timestamp: new Date().toISOString(),
        important: document.getElementById('important').checked,
        reminderTime: document.getElementById('reminderTime').value || null
    };

    // 处理重复提醒
    if (entry.reminderTime && document.getElementById('repeatReminder').checked) {
        entry.repeatInterval = document.getElementById('repeatInterval').value;
    }

    if (entryId) {
        // 编辑现有条目
        const index = entries.findIndex(e => e.id === entryId);
        if (index !== -1) {
            // 如果存在旧的提醒，清除它
            if (entries[index].timeoutId) {
                clearTimeout(entries[index].timeoutId);
            }
            entries[index] = entry;
        }
    } else {
        // 添加新条目
        entries.unshift(entry);
    }

    // 保存到localStorage
    localStorage.setItem('journalEntries', JSON.stringify(entries));

    // 如果设置了提醒，安排提醒
    if (entry.reminderTime) {
        scheduleReminder(entry);
    }

    // 重置表单并隐藏
    hideNewEntryForm();
    renderEntries();
});

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化语言
    updateLanguage();
    
    // 初始化提醒权限
    if ('Notification' in window) {
        Notification.requestPermission();
    }

    // 渲染条目
    renderEntries();

    // 为所有条目安排提醒
    entries.forEach(entry => {
        if (entry.reminderTime) {
            scheduleReminder(entry);
        }
    });
});

// 重复提醒复选框事件监听
document.getElementById('repeatReminder').addEventListener('change', function() {
    document.getElementById('repeatInterval').disabled = !this.checked;
});

// 搜索和筛选事件监听
searchInput.addEventListener('input', renderEntries);
document.getElementById('categoryFilter').addEventListener('change', renderEntries);
document.getElementById('dateFilter').addEventListener('change', renderEntries);
