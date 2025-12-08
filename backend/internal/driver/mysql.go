package driver

import (
	"fmt"
	"log"

	"typinggame-api/config"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase() *gorm.DB {
	cfg := config.Get()
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=true&loc=Local",
		cfg.Database.Username,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Database,
	)

	log.Printf("Connecting to MySQL at %s:%s/%s as user %s...", 
		cfg.Database.Host, cfg.Database.Port, cfg.Database.Database, cfg.Database.Username)
	
	if cfg.Database.Password == "" {
		log.Println("⚠️  Warning: DB_PASSWORD is empty! Check your .env file.")
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf(`
❌ ไม่สามารถเชื่อมต่อ Database ได้!

สาเหตุที่เป็นไปได้:
1. MySQL Server ไม่ได้รันอยู่
   - เปิด Services (Win+R → services.msc) → หา MySQL → Start
   - หรือรัน: net start MySQL80

2. การตั้งค่าในไฟล์ .env ไม่ถูกต้อง
   - ตรวจสอบ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
   - ไฟล์ .env ต้องอยู่ในโฟลเดอร์ backend/

3. Database ยังไม่ได้ถูกสร้าง
   - เชื่อมต่อ MySQL และรัน: CREATE DATABASE social_feed;

4. Firewall บล็อกการเชื่อมต่อ
   - ตรวจสอบว่า port 3306 เปิดอยู่

Error: %v
`, err)
	}

	log.Println("✅ เชื่อมต่อ Database สำเร็จ!")
	return db
}

