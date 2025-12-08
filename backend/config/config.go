package config

import (
	"log"
	"os"
	"path/filepath"

	"github.com/go-playground/validator/v10"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type server struct {
	Port string `envconfig:"PORT" default:"8080"`
}

type database struct {
	Host     string `envconfig:"DB_HOST" default:"localhost"`
	Port     string `envconfig:"DB_PORT" default:"3306"`
	Database string `envconfig:"DB_NAME" default:"social_feed"`
	Username string `envconfig:"DB_USER" default:"root"`
	Password string `envconfig:"DB_PASSWORD" default:""`
}

type jwt struct {
	Secret string `envconfig:"JWT_SECRET" default:"your-secret-key-change-in-production"`
}

type Config struct {
	Server   server
	Database database
	JWT      jwt
}

var cfg Config

func LoadConfig() error {
	wd, _ := os.Getwd()
	log.Printf("Current working directory: %s", wd)
	
	envPaths := []string{
		filepath.Join(wd, ".env"),
		".env",
		filepath.Join("backend", ".env"),
		filepath.Join("..", ".env"),
	}
	
	var loaded bool
	for _, envPath := range envPaths {
		absPath, _ := filepath.Abs(envPath)
		if info, err := os.Stat(envPath); err == nil && !info.IsDir() {
			log.Printf("Found .env file at: %s", absPath)
			if err := godotenv.Load(envPath); err == nil {
				log.Printf("✅ Successfully loaded .env file from: %s", absPath)
				loaded = true
				break
			} else {
				log.Printf("❌ Failed to load .env from %s: %v", absPath, err)
			}
		}
	}
	
	if !loaded {
		log.Printf("Trying default godotenv.Load() (searches current dir)...")
		if err := godotenv.Load(); err != nil {
			log.Printf("⚠️  Warning: .env file not found anywhere, using defaults or environment variables. Error: %v", err)
		} else {
			log.Printf("✅ Loaded .env file from default location")
			loaded = true
		}
	}
	
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("read env error : %s", err.Error())
	}
	
	log.Printf("Database config: Host=%s, Port=%s, Database=%s, User=%s, Password set=%v", 
		cfg.Database.Host, cfg.Database.Port, cfg.Database.Database, cfg.Database.Username, 
		cfg.Database.Password != "")
	
	if err := validator.New().Struct(&cfg); err != nil {
		return err
	}

	return nil
}

func Get() Config {
	return cfg
}

