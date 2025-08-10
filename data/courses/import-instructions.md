# Course Import Instructions

## 大量データインポート方法

### 1. CSV形式でインポート
CSVファイルを作成し、以下のヘッダーを使用：
```
Subject Description,Title,Course Number,Section,Term,Linked Sections,Instructor,Meeting Times,Schedule Type,Attribute
```

実行コマンド：
```bash
npx tsx scripts/bulk-import-courses.ts csv データファイル.csv
```

### 2. JSON形式でインポート
JSONファイルを作成（配列形式）：
```json
[
  {
    "subjectDescription": "Computer Science",
    "title": "Introduction to Programming",
    "courseNumber": "CS 101",
    "section": "01",
    "term": "Fall 2025",
    "linkedSections": "",
    "instructor": "Smith, John",
    "meetingTimes": "MWF 10:00-11:00",
    "scheduleType": "Lecture",
    "attribute": "STEM"
  }
]
```

実行コマンド：
```bash
npx tsx scripts/bulk-import-courses.ts json データファイル.json
```

### 3. タブ区切りテキストでインポート
タブ区切りのテキストファイルを作成し、実行：
```bash
npx tsx scripts/bulk-import-courses.ts text データファイル.txt
```

### 注意事項
- CRNフィールドは自動的に無視されます
- 751コース全てを一度にインポート可能です
- 既存のデータは上書きされます