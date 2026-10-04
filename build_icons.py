import os

ICONS_DIR = os.path.join("assets", "icons")
OUTPUT_JS = os.path.join("js", "utils", "icons.js")

def build_icons():
    if not os.path.exists(ICONS_DIR):
        print(f"❌ Ошибка: Папка {ICONS_DIR} не найдена!")
        return

    svg_entries = []
    count = 0

    print("🔍 Сканирование папки с иконками...")

    for file in sorted(os.listdir(ICONS_DIR)):
        if file.lower().endswith(".svg"):
            icon_name = os.path.splitext(file)[0]
            file_path = os.path.join(ICONS_DIR, file)

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                # Читаем SVG, убираем лишние переносы строк и экранируем обратные кавычки
                content = f.read().strip().replace("`", "\\`")
                # Убираем лишние пробелы между тегами для легкости
                content = " ".join(content.split())
                
                svg_entries.append(f"            '{icon_name}': `{content}`")
                count += 1
                print(f"  [+] Добавлена иконка: {icon_name} ({file})")

    # Формируем итоговый JS файл
    js_content = "window.AppIcons = {\n"
    js_content += "    get(name) {\n"
    js_content += "        const svgStore = {\n"
    js_content += ",\n".join(svg_entries) + "\n"
    js_content += "        };\n"
    js_content += "        return svgStore[name] || '';\n"
    js_content += "    }\n"
    js_content += "};\n"

    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)

    print("-" * 50)
    print(f"✅ Готово! Всего собрано иконок: {count}")
    print(f"📁 Файл обновлен: {OUTPUT_JS}")
    print("-" * 50)

if __name__ == "__main__":
    build_icons()