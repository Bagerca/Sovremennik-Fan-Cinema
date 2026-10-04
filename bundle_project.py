import os

# Имя итогового файла
OUTPUT_FILE = "merged_project_for_llm.txt"

# Папки, которые скрипт будет пропускать
IGNORE_DIRS = {
    '.git', '.vscode', '.idea', 'node_modules', 
    '__pycache__', 'venv', '.venv', 'dist', 'build'
}

# Расширения файлов с кодом, которые нужно объединить
INCLUDE_EXTENSIONS = {
    '.html', '.css', '.js', '.json', '.py', '.svg', '.md'
}

# Файлы, которые нужно исключить
IGNORE_FILES = {
    OUTPUT_FILE
}

def merge_project():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(root_dir, OUTPUT_FILE)
    
    merged_count = 0
    total_lines = 0

    print("🚀 [Bundler] Сборка проекта началась...")

    with open(output_path, 'w', encoding='utf-8') as outfile:
        # Проходимся по всем папкам и файлам проекта
        for current_root, dirs, files in os.walk(root_dir):
            # Фильтруем игнорируемые директории на лету
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                if file in IGNORE_FILES:
                    continue

                _, ext = os.path.splitext(file)
                if ext.lower() in INCLUDE_EXTENSIONS:
                    file_path = os.path.join(current_root, file)
                    rel_path = os.path.relpath(file_path, root_dir).replace('\\', '/')

                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            content = infile.read()
                            lines = content.count('\n') + 1

                            # Разделитель и шапка для каждого файла
                            outfile.write("=" * 80 + "\n")
                            outfile.write(f"File: {rel_path}\n")
                            outfile.write("=" * 80 + "\n\n")
                            outfile.write(content)
                            outfile.write("\n\n")

                            merged_count += 1
                            total_lines += lines
                            print(f" [+] Добавлен: {rel_path} ({lines} строк)")

                    except Exception as e:
                        print(f" [!] Ошибка при чтении файла {rel_path}: {e}")

    file_size_kb = os.path.getsize(output_path) / 1024
    print("-" * 50)
    print(f"✅ [Bundler] Готово! Собрано файлов: {merged_count}")
    print(f"📊 Всего строк кода: {total_lines}")
    print(f"💾 Размер бандла: {file_size_kb:.2f} KB")
    print(f"📁 Файл сохранен как: {OUTPUT_FILE}")
    print("-" * 50)

if __name__ == "__main__":
    merge_project()