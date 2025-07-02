const SPREADSHEET_ID = '1vKErM8FIGNM5if0zpsaCWutsQgscqrPo2bUWJACTcf0';
const API_KEY = 'AIzaSyCQXd2XVsxnC2_ZoVFY9igDJlb-d96F62w';
const CLIENT_ID = 'https://49343525916-dt32rrjpvdpifvasp76int8kerlqnakp.apps.googleusercontent.com'; // Замените на реальный!

let isGAPILoaded = false;

// 1. Загрузка Google API
function loadGAPI() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// 2. Инициализация клиента
async function initGAPIClient() {
  await gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    });
    isGAPILoaded = true;
  });
}

// 3. Загрузка данных с листа
async function loadSheetData(sheetName, range = 'A1:Z1000') {
  if (!isGAPILoaded) throw new Error('GAPI not initialized');
  
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`
  });
  return response.result.values || [];
}

// 4. Инициализация данных формы
async function initFormData() {
  try {
    // Загрузка областей (столбец B)
    const regionsData = await loadSheetData('Населённые пункты', 'B1:B');
    window.regions = [...new Set(regionsData.flat().filter(Boolean))];
    
    // Загрузка городов (столбец A)
    const citiesData = await loadSheetData('Населённые пункты', 'A1:A');
    window.cities = [...new Set(citiesData.flat().filter(Boolean))];
    
    // Загрузка профилей (столбец C, начиная с 8 строки)
    const profilesData = await loadSheetData('Разделы', 'C8:C');
    window.activityProfiles = [...new Set(profilesData.flat().filter(Boolean))];
    
    console.log('Данные формы загружены');
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    // Запасные данные
    window.regions = ['Киевская', 'Харьковская'];
    window.cities = ['Киев', 'Харьков'];
    window.activityProfiles = ['IT', 'Медицина'];
  }
}

// 5. Отправка данных в таблицу "Услуги"
async function submitToServices(values) {
  if (!isGAPILoaded) throw new Error('GAPI not initialized');
  
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Услуги!A:Z',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] }
  });
}

// Главная функция инициализации
async function initializeApp() {
  try {
    await loadGAPI();
    await initGAPIClient();
    await initFormData();
    
    console.log('Города:', window.cities);
    console.log('Профили:', window.activityProfiles);
    
    // Здесь можно вызывать функции для работы с формой
  } catch (error) {
    console.error('Фатальная ошибка:', error);
  }
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', initializeApp);