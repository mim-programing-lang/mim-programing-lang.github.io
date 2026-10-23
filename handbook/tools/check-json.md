# خرج الفحص `meem --check --json`

`meem --check --json ملف.م` يطبع سطر JSON واحداً ولا ينفّذ البرنامج؛ رمز الخروج 0 بلا أخطاء و2 معها. مخططه (JSON Schema)
في [check-json.schema.json](check-json.schema.json)، **ويتحقق منه `tests/test_docs.py` على خرج المجمّع الفعلي** لبرامج
فيها أخطاء وتحذيرات واستيراد ومنطقة خطرة. معاني الحقول وقواعدها (قيمة `file`، و`related`، والتحذيرات الاستشارية)
في [../../tools-contract.md](../../tools-contract.md)، وهو العقد: رقمه `contract` لا يتغير معناه دون رفعه.

| الحقل الأعلى | المعنى |
|---|---|
| `version` | 2 |
| `ok` | لا أخطاء |
| `file`، `path` | الملف الرئيسي للعرض، ومساره الكامل |
| `summary` | عدد الأخطاء والتحذيرات والصيغ المهجورة |
| `diagnostics` | كل تشخيص: `severity` و`phase` و`message` و`line` و`column` و`length` و`hint` و`notes` و`related` و`source_line` و`deprecated` و`advisory`، و`unsafe` حين يوجد |
| `imports` | ما يستورده الملف الرئيسي مباشرة |
| `files` | كل ملفات البرنامج بترتيب التحميل |

خيارات سطر الأوامر كلها في [options.md](options.md).
