# ZapKit - הפעלה מקומית

## דרישות מקדימות

1. **Python 3.11+** - [הורד כאן](https://www.python.org/downloads/)
2. **Node.js 20+** - [הורד כאן](https://nodejs.org/)

## הפעלה מהירה

### Windows:
פשוט לחץ פעמיים על הקובץ:
```
START-LOCAL.bat
```

זהו! הכל יעבוד אוטומטית.

## מה קורה?

הסקריפט יפתח 4 חלונות:
1. **Backend** (http://localhost:8000) - שרת הבקאנד
2. **Home** (http://localhost:8080) - דף הבית
3. **TinyLink Pro** (http://localhost:5173) - אפליקציית קיצור לינקים
4. **QR Generator Pro** (http://localhost:5175) - אפליקציית QR

## איך להשתמש?

1. פתח דפדפן וגש ל: **http://localhost:8080**
2. תראה את דף הבית עם 2 כפתורים
3. לחץ על **TinyLink Pro** או **QR Generator Pro**
4. הכל עובד!

## התחברות

- לחץ על **Login** בדף הבית
- הירשם עם אימייל וסיסמה
- כל הנתונים נשמרים במסד נתונים מקומי (`tinylink.db`)

## עצירת השירותים

לחץ `Ctrl+C` בכל אחד מהחלונות, או פשוט סגור אותם.

## בעיות נפוצות

### "Python is not installed"
התקן Python מ: https://www.python.org/downloads/
וודא שסימנת "Add Python to PATH" בהתקנה

### "Node.js is not installed"
התקן Node.js מ: https://nodejs.org/

### הפורט תפוס
אם אחד הפורטים תפוס, סגור את התוכנית שמשתמשת בו או שנה את הפורט בקבצי ה-.env.local

## מבנה הפרויקט

```
ZapKit/
├── home/                    # דף הבית (HTML סטטי)
├── tinylink-pro/
│   ├── backend/            # FastAPI + SQLite
│   └── frontend/           # React + Vite
├── qr-generator-pro/
│   └── frontend/           # React + Vite
└── START-LOCAL.bat         # סקריפט הפעלה
```

## קבצי הגדרות

כל האפליקציות משתמשות בקבצי `.env.local` להגדרות מקומיות:
- `tinylink-pro/backend/.env.local` - הגדרות בקאנד
- `tinylink-pro/frontend/.env.local` - הגדרות TinyLink
- `qr-generator-pro/frontend/.env.local` - הגדרות QR Generator

## תמיכה

אם משהו לא עובד, בדוק:
1. Python ו-Node.js מותקנים
2. כל הפורטים פנויים (8000, 8080, 5173, 5175)
3. אין שגיאות בחלונות הטרמינל

---

**נהנה מ-ZapKit? ⭐ תן כוכב בגיטהאב!**
