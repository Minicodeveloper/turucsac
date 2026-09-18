<?php

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

use Dotenv\Dotenv;

class Config
{
    private static array $env = [];

    public static function load(string $path = __DIR__ . '/.env'): void
    {
        if (!file_exists($path)) {
            self::$env = $_ENV;
            return;
        }

        $dotenv = Dotenv::createImmutable(__DIR__, basename($path));
        $dotenv->safeLoad();

        self::$env = $_ENV;

        foreach (self::$env as $key => $value) {
            if (is_scalar($value)) {
                putenv("$key=$value");
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        if (empty(self::$env)) {
            self::load();
        }

        $value = self::$env[$key] ?? $_ENV[$key] ?? getenv($key);

        return $value !== null && $value !== '' ? $value : $default;
    }
}