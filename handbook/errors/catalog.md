# فهرس رسائل الأخطاء والتحذيرات

**مولَّد** من مصادر المجمّع والمكتبة القياسية بـ`scripts/gen_handbook.py` (كل نداء يبلّغ رسالة ثابتة النص؛ `…`
موضع جزء متغير). لا يُحرَّر باليد.

- **المعرّف** مشتق من نص الرسالة ومرحلتها (أول ستة أرقام ست عشرية من SHA-1). **مؤقت**: المجمّع لا يعطي الرسائل
  معرّفات بعد، وتغيير نص الرسالة يغيّره. المعرّفات الثابتة في التشخيص (`--check --json`) **مخطط**
  ([../../v1-readiness.md](../../v1-readiness.md)).
- **رمز الخروج:** 2 لأخطاء الترجمة (لا يُنفَّذ شيء)، 3 لأخطاء التشغيل، 1 لسطر الأوامر، 0 للتحذير (يصير 2 مع
  `--strict` إلا الاستشاري). ([cli.md](../../cli.md))
- **مثال يسببها:** أول برنامج مرجعي في `tests/programs/` يطبعها؛ «—» حين لا برنامج يطبعها بعد. الأخطاء الشائعة
  بسببها وإصلاحها مشغَّلين في [common.md](common.md).
- رسائل `توليد الكود` غير رمز خارجي مفقود شبكة أمان: لا يبلغها برنامج يمرّ من الفحص الدلالي.

## أكثر الرسائل ظهوراً، بمثال

عُدّت في مخرجات البرامج المرجعية. ما ليس منها في [common.md](common.md) (هناك بسببه وإصلاحه):

### وسيط مدمجة من نوع آخر

```ميم
اطبع(طول(5))
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ دلالي] سطر 1:6 - دالة 'طول' تعمل فقط مع القوائم والمصفوفات والقواميس والنصوص لكن وُجد النوع 'عدد'
   1 | اطبع(طول(5))
     |      ^
```

### وسيط دالة من نوع آخر

```ميم
داله ضعف(س عدد) عدد:
    ارجع س * 2
اطبع(ضعف("اثنان"))
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ دلالي] سطر 3:10 - الوسيط للمعامل 'س' في الدالة 'ضعف' يجب أن يكون من النوع 'عدد' لكن مُرّر 'نص'
   3 | اطبع(ضعف("اثنان"))
     |          ^
```

### هيكل غير معرَّف

```ميم
ن = نقطه(1, 2)
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ دلالي] سطر 1:5 - الدالة أو الهيكل 'نقطه' غير معرّف
   1 | ن = نقطه(1, 2)
     |     ^~~~
  تلميح: عرّف الدالة بـ 'داله' قبل استدعائها (يجب أن يظهر تعريفها في الملف قبل أول استدعاء).
```

### متوقع شيء ووُجد غيره (نحوي)

```ميم
اطبع(1 2)
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ نحوي] سطر 1:8 - متوقع ')' لكن وُجد '2'
   1 | اطبع(1 2)
     |        ^
  تلميح: هل نسيت إغلاق قوس استدعاء 'اطبع' أو الفاصلة ',' بين الوسائط؟
```

### عملية لا تدعمها الأنواع

```ميم
اطبع(صواب * 2)
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ دلالي] سطر 1:11 - العملية '*' غير مدعومة للأنواع 'منطقي' و 'عدد'
   1 | اطبع(صواب * 2)
     |           ^
  تلميح: القيم المنطقية لا تدخل في العمليات الحسابية.
```

### متغير قد يُستعمل قبل إسناده (تحذير)

```ميم
اذا 1 > 2:
    س = 1
اطبع(س)
```

```خطأ
رمز الخروج: 0
--- stdout ---
0
--- stderr ---

[تحذير دلالي] سطر 3:6 - المتغير 'س' قد يُستخدم هنا قبل إسناد قيمة له
   3 | اطبع(س)
     |      ^
  تلميح: أسند له قيمة ابتدائية قبل الشرط أو الحلقة التي تعرّفه؛ إن لم يُنفَّذ ذلك المسار فقيمته صفر أو فارغة.
```

### دالة تحجب مدمجة (تحذير)

```ميم
داله طبع(س عدد) عدد:
    ارجع س
داله نص_ما() نص:
    ارجع "ن"
داله دمج(ا نص) نص:
    ارجع ا
اطبع(دمج("س"))
```

```خطأ
رمز الخروج: 0
--- stdout ---
س
--- stderr ---

[تحذير دلالي] سطر 5:1 - الدالة 'دمج' تحجب الدالة المدمجة بالاسم نفسه
   5 | داله دمج(ا نص) نص:
     | ^
  تلميح: بعد هذا التعريف لن تكون الدالة المدمجة 'دمج' متاحة.
```

### خطأ لم يُعالَج في المستوى الأعلى

```ميم
ن = جرّب عدد("ليس عدداً")
```

```خطأ
رمز الخروج: 3
--- stdout ---
--- stderr ---
[خطأ تشغيل] سطر 1:5 - خطأ لم يُعالَج: صيغة_خاطئة
  ن = جرّب عدد("ليس عدداً")
```

### وضع بلا_افتراضي

```ميم
بلا_افتراضي
ق = [1, 2]
```

```خطأ
رمز الخروج: 2
--- stdout ---
--- stderr ---

[خطأ دلالي] سطر 2:5 - قيمة حرفية تحجز من الافتراضي: الوحدة في وضع بلا_افتراضي (لا حجز من المخصص الافتراضي)
   2 | ق = [1, 2]
     |     ^
  تلميح: اكتبها قائمة_من([...], م) بمخصص صريح، فتُبنى فيه مباشرة.
```

### مفتاح غائب (تشغيل)

```ميم
ق = {"ا": 1}
اطبع(ق["ب"])
```

```خطأ
رمز الخروج: 3
--- stdout ---
--- stderr ---
[خطأ تشغيل] سطر 2:7 - المفتاح 'ب' غير موجود في القاموس
  اطبع(ق["ب"])
```


## لفظي

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `M576E72` | الرمز '…' غير مدعوم | 2 | `lexer.py (tokenize)` | `tests/programs/اخطاء/لفظي_رمز_غير_مدعوم.م` |
| `M6DC91B` | الرمز المفرد يجب أن يحتوي على حرف واحد فقط | 2 | `lexer.py (tokenize)` | — |
| `M37A3B7` | العامل '..' أُلغي من اللغة: استخدم "+" بين نصين، أو الفاصلة داخل اطبع | 2 | `lexer.py (tokenize)` | `tests/programs/اخطاء/نقطتان_ملغاة.م` |
| `MBF767A` | المسافة البادئة (…) لا تطابق أي مستوى سابق | 2 | `lexer.py (tokenize)` | `tests/programs/اخطاء/لفظي_مسافة_بادئة.م` |
| `MB293CC` | علامة تنصيص مزدوجة غير مغلقة | 2 | `lexer.py (tokenize)` | `tests/programs/اخطاء/لفظي_نص_غير_مغلق.م` |
| `MA90403` | علامة تنصيص مفردة غير مغلقة | 2 | `lexer.py (tokenize)` | — |

## نحوي

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `M4429B2` | 'اخطاء:' بحاجة إلى اسم خطأ واحد على الأقل في سطر تالٍ | 2 | `parser.py (_parse_statement)` | — |
| `MD0690F` | 'والا' لا تتسلسل: عالج الخطأ مرة واحدة | 2 | `parser.py (parse_catch)` | — |
| `M8B7D4E` | اسم خطأ واحد في كل سطر | 2 | `parser.py (_parse_statement)` | — |
| `M75571A` | التعبير أعقد مما يدعمه المجمّع (أكثر من … مستوى من الأقواس أو العمليات المتتالية) | 2 | `parser.py (too_complex)` | `tests/programs/امان/اقواس_اعمق_من_الحد.م` |
| `MED5466` | التعداد '…' بحاجة إلى عضو واحد على الأقل في سطر تالٍ | 2 | `parser.py (_parse_statement)` | — |
| `MEB49B0` | الدالة الخارجية تصريح بلا جسم: لا ':' بعدها | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/نحوي_خارجي.م` |
| `MF49C02` | الدوال المتداخلة غير مدعومة: تعريف دالة داخل الدالة '…' | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/دالة_داخل_دالة.م` |
| `ME243B9` | الطرف الأيسر من '=' لا يمكن الإسناد إليه | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `ME3887C` | الطرف الأيسر من '…' لا يمكن التعديل عليه | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/نحوي_مدمجة.م` |
| `M4A95EF` | انتهى السطر بشكل مفاجئ: متوقع … | 2 | `parser.py (consume)` | `tests/programs/اخطاء/نحوي_متعدد.م` |
| `M1C386B` | انتهى الملف قبل اكتمال التعبير: متوقع قيمة أو تعبير | 2 | `parser.py (parse_primary)` | — |
| `M548243` | انتهى الملف قبل اكتمال الجملة: متوقع … | 2 | `parser.py (consume)` | — |
| `M8F7EB3` | بعد 'خاتمه' جملة بسيطة واحدة: استدعاء دالة أو إسناد | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/خاتمه_اخطاء.م` |
| `MC2B35C` | تداخل الكتل أعمق مما يدعمه المجمّع (أكثر من … مستوى) | 2 | `parser.py (parse_block)` | `tests/programs/امان/كتل_اعمق_من_الحد.م` |
| `M56D77A` | تعبير غير مكتمل: متوقع قيمة لكن وُجد … | 2 | `parser.py (parse_primary)` | `tests/programs/اخطاء/نحوي_متعدد.م` |
| `MCFEEE3` | تعريف حقل غير صالح داخل الهيكل | 2 | `parser.py (parse_struct_field)` | — |
| `M015563` | رمز غير صالح في هذا الموضع: … | 2 | `parser.py (parse_primary)` | — |
| `M4E7754` | رمز غير متوقع … بعد نهاية الجملة | 2 | `parser.py (parse_statement)` | — |
| `M32A926` | عضو واحد في كل سطر (بلا قيمة: رقم العضو موضعه) | 2 | `parser.py (_parse_statement)` | — |
| `M38E94A` | متوقع 'حاله' داخل كتلة 'حالات' لكن وُجد … | 2 | `parser.py (_parse_statement)` | — |
| `ME24119` | متوقع استدعاء أو إسناد بعد 'خاتمه' | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/خاتمه_اخطاء.م` |
| `MCEBF45` | متوقع اسم الدالة في C بين علامتي اقتباس بعد 'باسم' | 2 | `parser.py (_parse_statement)` | `tests/programs/اخطاء/نحوي_خارجي3.م` |
| `M6F954C` | متوقع اسم وحدة أو مسار ملف بعد 'استورد' | 2 | `parser.py (_parse_statement)` | — |
| `M0D4DC4` | متوقع تعبير بعد '…' | 2 | `parser.py (parse_unary)` | — |
| `MEB4EDE` | متوقع قيمة بديلة أو «اسم:» بعد 'والا' | 2 | `parser.py (parse_catch)` | — |
| `MF89C6A` | متوقع … لكن وُجد … | 2 | `parser.py (consume)` | `tests/programs/اخطاء/معامل_بقيمة_افتراضية.م` |
| `M5AEE38` | … بحاجة إلى جسم (كتلة) بعد النقطتين | 2 | `parser.py (_parse_block)` | — |

## دلالي

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `MC49745` | '+' على نصين غير ثابتين يحجز من الافتراضي | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `MEE86AF` | '+=' على نص يحجز من الافتراضي | 2 | `semantic_analyzer.py (visit_AugAssignNode)` | `tests/programs/اخطاء/بلا_افتراضي_دمج.م` |
| `M829A86` | 'اخطاء:' في المستوى الأعلى من الملف فقط | 2 | `semantic_analyzer.py (visit_ErrorSetNode)` | — |
| `M073707` | 'ارجع' لا يمكن استخدامها خارج دالة | 2 | `semantic_analyzer.py (visit_ReturnNode)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `MF389A5` | 'اضف' تعمل مع القوائم فقط لكن وُجد النوع '…' | 2 | `builtin_funcs.py (emit)` | — |
| `M4233FD` | 'اضف' تعمل مع القوائم فقط لكن … من النوع '…' | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `MA3D566` | 'الافتراضي' مذكور | 2 | `semantic_analyzer.py (visit_VarNode)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `M380A82` | 'بلا_افتراضي' ترويسة تُكتب في أول الملف قبل أي جملة | 2 | `semantic_analyzer.py (visit_NoDefaultNode)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `MD534FA` | 'بلا_فحص' تسبق إسناداً إلى عنصر: بلا_فحص حاوية[فهرس] = قيمة | 2 | `semantic_analyzer.py (analyze_statement)` | — |
| `MEA019A` | 'بلا_فحص' تسبق فهرسة أو تحويلاً إلى نوع ثابت الحجم: بلا_فحص حاوية[فهرس]، بلا_فحص عدد8(س) | 2 | `semantic_analyzer.py (visit_UncheckedNode)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `M2874B5` | 'تجاوز' لا يمكن استخدامها خارج حلقة | 2 | `semantic_analyzer.py (visit_ContinueNode)` | — |
| `M380DDB` | 'تعداد' في المستوى الأعلى من الملف فقط | 2 | `semantic_analyzer.py (visit_EnumDefNode)` | — |
| `M6A219F` | 'توقف' لا يمكن استخدامها خارج حلقة | 2 | `semantic_analyzer.py (visit_BreakNode)` | `tests/programs/اخطاء/دلالي_متعدد.م` |
| `M517533` | 'جديد' بلا مخصص تحجز من الافتراضي | 2 | `semantic_analyzer.py (analyze_new)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `M9616CB` | 'جرّب' على تعبير لا يفشل (نوعه '…') | 2 | `semantic_analyzer.py (visit_TryNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `MB94C63` | 'جرّب' في الدالة '…' التي لا ترجع خطأ (نوعها '…') | 2 | `semantic_analyzer.py (visit_TryNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `M860469` | 'خاتمه_عند_خطأ' في الدالة '…' التي لا ترجع خطأ | 2 | `semantic_analyzer.py (visit_DeferNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `M25CC0D` | 'رتب' على قائمة عناصرها '…' غير مدعومة | 2 | `collection_builtins.py (check)` | `tests/programs/اخطاء/دوال_رئيسية_اخطاء.م` |
| `M641A44` | 'شريحة' تأخذ مؤشراً إلى كتلة لكن وُجد '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `MEF04B3` | 'شريحة_خام' تأخذ مؤشر_خام لكن وُجد '…' | 2 | `lowlevel.py (check)` | — |
| `M4E530B` | 'عام' تُستخدم داخل الدوال فقط | 2 | `semantic_analyzer.py (visit_GlobalDeclNode)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `MCE4266` | 'قائمة_من' تأخذ قائمة لا '…' | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/حاويات_بمخصص_اخطاء.م` |
| `M2DA346` | 'قطعة' تأخذ شريحة لكن وُجد '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `M868890` | 'مخزن_ثابت' يأخذ شريحة[بايت] لا '…' | 2 | `allocators.py (check)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `ME8B145` | 'مدى' تُستخدم فقط في رأس حلقة 'لكل' | 2 | `builtin_funcs.py (emit)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `MB09035` | 'من_نص_سي' تأخذ نص_سي (مؤشر[طبيعي8]) لكن وُجد '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/نص_سي_اخطاء.م` |
| `M823175` | 'نسخ' تعمل مع القوائم والقواميس والهياكل والمصفوفات لكن وُجد النوع '…' | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/حاويات_بمخصص_اخطاء.م` |
| `MB3D582` | 'نسخ' لا تعمل مع النوع '…' | 2 | `builtin_funcs.py (emit)` | — |
| `M48F424` | 'نص_سي' تأخذ نصاً لكن وُجد '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/نص_سي_اخطاء.م` |
| `M0A4ACA` | 'والا قيمة' على تعبير '!فراغ' لا ناتج له | 2 | `semantic_analyzer.py (visit_CatchNode)` | — |
| `M689DD5` | 'والا' بعد تعبير لا يفشل (نوعه '…') | 2 | `semantic_analyzer.py (visit_CatchNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `MA80B03` | '…' أمر وليست دالة تُرجع قيمة | 2 | `semantic_analyzer.py (analyze_value)` | `tests/programs/اخطاء/دلالي_اطبع_وسائط.م` |
| `MA51B79` | '…' اسم دالة وليس متغيراً | 2 | `semantic_analyzer.py (undefined_name_error)` | — |
| `MDF1761` | '…' اسم هيكل وليس متغيراً | 2 | `semantic_analyzer.py (undefined_name_error)` | — |
| `M662E82` | '…' اسم وحدة قياسية، وفي المشروع ملف بالاسم نفسه: … | 2 | `modules.py (locate)` | — |
| `MB442B8` | '…' بلا مخصص تحجز من الافتراضي (أو تحرر إليه) | 2 | `semantic_analyzer.py (analyze_builtin)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `M6D9B0C` | '…' تأخذ … لكن وُجد النوع '…' | 2 | `collection_builtins.py (_check_container_search)` | `tests/programs/اخطاء/دوال_رئيسية_اخطاء.م` |
| `M23717F` | '…' تتطلب مؤشراً لكن الوسيط من النوع '…' | 2 | `builtin_funcs.py (_require_pointer)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `MDBD135` | '…' تحوّل … لا '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `M21CE32` | '…' تعمل مع القوائم لكن وُجد النوع '…' | 2 | `collection_builtins.py (_require_list)` | — |
| `M14AC46` | '…' تعمل مع القواميس فقط لكن وُجد النوع '…' | 2 | `builtin_funcs.py (_check_dict_and_key)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M5DC0A5` | '…' تعمل مع القواميس لكن وُجد النوع '…' | 2 | `collection_builtins.py (check)` | `tests/programs/اخطاء/دوال_رئيسية_اخطاء.م` |
| `M6C0C2F` | '…' تُستخدم فقط في رأس حلقة 'لكل' | 2 | `semantic_analyzer.py (analyze_builtin)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M7BD7D5` | '…' خاص بالوحدة '…' (معرَّف فيها بـ 'خاص') | 2 | `modules.py (qualified)` | `tests/programs/اخطاء/دلالي_رياضيات.م` |
| `MFC74B0` | '…' على قائمة عناصرها '…' غير مدعومة | 2 | `collection_builtins.py (_check_container_search)` | `tests/programs/اخطاء/دوال_رئيسية_اخطاء.م` |
| `MC25E04` | '…' ليست وحدة مستوردة في هذا الملف | 2 | `modules.py (type_expr)` | `tests/programs/متعدد/12b_هياكل_خطأ.م` |
| `M8FB085` | '…' متغير خاص بالوحدة '…' | 2 | `modules.py (qualified)` | `tests/programs/متعدد/11b_خاص_خطأ.م` |
| `M968285` | '…' متغير عام، ولا يمكن تعديله داخل الدالة '…' دون التصريح بذلك | 2 | `semantic_analyzer.py (global_write_error)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `MFEC1E7` | '…' متغير من النوع '…': لا يحمل الخطأ | 2 | `semantic_analyzer.py (visit_CatchNode)` | — |
| `MB6FEA2` | '…' متغير وليس دالة | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | — |
| `M343F78` | '…' معرّف محلياً في الدالة قبل التصريح بأنه عام | 2 | `semantic_analyzer.py (visit_GlobalDeclNode)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `MBF4ED3` | '…' من النوع '…' … لكن … | 2 | `semantic_analyzer.py (analyze_indirect_call)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `MB7F892` | '…' وحدة مستوردة وليست قيمة | 2 | `semantic_analyzer.py (undefined_name_error)` | `tests/programs/متعدد/18c_وحدة_كقيمة.م` |
| `M5EFFA3` | '…' … لكن … | 2 | `semantic_analyzer.py (analyze_builtin)` | `tests/programs/اخطاء/حاويات_بمخصص_اخطاء.م` |
| `MA02AB5` | '…(...)' تأخذ رقم العضو وحده | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | — |
| `ME89A16` | '…(...)' تأخذ عدداً (رقم العضو من 0) لا '…' | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | `tests/programs/اخطاء/تعداد_اخطاء.م` |
| `MD3956E` | '….…' ثابت وليس دالة | 2 | `modules.py (qualified)` | — |
| `M01A4A0` | '….…' دالة أو هيكل وليس ثابتاً | 2 | `modules.py (qualified)` | `tests/programs/متعدد/18b_اخطاء_الاسم_المؤهل.م` |
| `M1D87D6` | اسم المعامل '…' مكرر في الدالة '…' | 2 | `semantic_analyzer.py (visit_FuncDefNode)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `MCC4E1C` | الاسم '…' مستخدم لهيكل بالفعل | 2 | `semantic_analyzer.py (visit_FuncDefNode)` | — |
| `M9526E6` | الاسم '…' مستعمل لوحدتين مستوردتين في هذا الملف | 2 | `modules.py (load_module)` | `tests/programs/متعدد/18_اخطاء_استيراد.م` |
| `MFC2B39` | الاسم '…' معرَّف بالفعل | 2 | `semantic_analyzer.py (visit_ExternFuncNode)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `MB5CD99` | الاسم '…' معرَّف في أكثر من ملف مستورد: … | 2 | `semantic_analyzer.py (imported_constant)` | `tests/programs/متعدد/12b_هياكل_خطأ.م` |
| `MCB30FD` | الاسم '…' معرَّف هيكلاً بالفعل | 2 | `semantic_analyzer.py (visit_EnumDefNode)` | — |
| `MF09D4B` | التعداد '…' لا عضو فيه باسم '…' | 2 | `semantic_analyzer.py (enum_member)` | `tests/programs/اخطاء/تعداد_اخطاء.م` |
| `M853262` | التعداد '…' معرَّف بالفعل (السطر …) | 2 | `semantic_analyzer.py (visit_EnumDefNode)` | — |
| `M759E3B` | الثابت '…' غير معرَّف في وحدته | 2 | `semantic_analyzer.py (visit_VarNode)` | — |
| `M0DC5DF` | الحقل '…' بلا قيمة افتراضية ويأتي بعد الحقل '…' الذي له قيمة افتراضية | 2 | `semantic_analyzer.py (visit_StructDefNode)` | `tests/programs/اخطاء/حقل_الزامي_بعد_افتراضي.م` |
| `MC7B123` | الحقل '…' في هيكل_سي '…' بلا نوع | 2 | `semantic_analyzer.py (visit_StructDefNode)` | `tests/programs/اخطاء/هيكل_سي_اخطاء.م` |
| `M4FF5F0` | الحقل '…' في هيكل_سي '…' من النوع '…': لا تخطيط له في C | 2 | `semantic_analyzer.py (check_c_field)` | `tests/programs/اخطاء/هيكل_سي_اخطاء.م` |
| `M50E0DB` | الحقل '…' مكرر في الهيكل '…' | 2 | `semantic_analyzer.py (visit_StructDefNode)` | — |
| `MC754AF` | الحقل '…' من الهيكل '…' بلا قيمة افتراضية ويجب تمرير قيمته | 2 | `semantic_analyzer.py (analyze_struct_init)` | `tests/programs/اخطاء/حقل_الزامي_متروك.م` |
| `M4748B8` | الخطأ '…' غير معرَّف | 2 | `semantic_analyzer.py (visit_ErrorValueNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `MF0837E` | الخطأ '…' مكرر في 'اخطاء:' | 2 | `semantic_analyzer.py (visit_ErrorSetNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `M42DB63` | الخطأ '…' من المجموعة القياسية: لا يُعرَّف | 2 | `semantic_analyzer.py (visit_ErrorSetNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `MD02D76` | الدالة '…' ترجع '!فراغ': ارجع وحدها أو ارجع خطأ.اسم | 2 | `semantic_analyzer.py (fallible_return)` | — |
| `M8CE113` | الدالة '…' ترجع '!…': ارجع قيمة أو خطأ | 2 | `semantic_analyzer.py (fallible_return)` | — |
| `M81E643` | الدالة '…' ترجع '…': مؤشر دالة ترجع خطأ غير مدعوم بعد | 2 | `semantic_analyzer.py (function_value)` | — |
| `M163C6A` | الدالة '…' تُرجع '…' في موضع و '…' في موضع آخر | 2 | `semantic_analyzer.py (check_container_return)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M10CED5` | الدالة '…' غير معرفة | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | — |
| `M6A0D7C` | الدالة '…' لا تُؤخذ قيمة: أنواع معاملاتها أو إرجاعها غير محددة بالكامل | 2 | `semantic_analyzer.py (function_value)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `MFF8DBA` | الدالة '…' معلنة بنوع الإرجاع '…' لكنها لا تُرجع أي قيمة | 2 | `semantic_analyzer.py (instantiate)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M5171FC` | الدالة '…' من نوع 'فراغ' ولا تُرجع قيمة يمكن استخدامها | 2 | `semantic_analyzer.py (analyze_value)` | — |
| `M1EB97B` | الدالة '…' من نوع 'فراغ' ولا يمكنها إرجاع قيمة | 2 | `semantic_analyzer.py (visit_ReturnNode)` | — |
| `MCCDCF3` | الدالة '…' يجب أن تُرجع قيمة من النوع '…' | 2 | `semantic_analyzer.py (visit_ReturnNode)` | — |
| `ME1CA88` | الدالة '…' … لكن … | 2 | `semantic_analyzer.py (analyze_extern_call)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MC17F37` | الدالة أو الهيكل '…' غير معرّف | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `M3354E7` | الدالة الخارجية '…' لا تُؤخذ قيمة | 2 | `semantic_analyzer.py (function_value)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `M80DCA1` | الطرف الأيسر من '…' لا يمكن الإسناد إليه: نتيجة استدعاء '…' ليست موضعاً | 2 | `semantic_analyzer.py (require_deref_target)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M3E9865` | العدد كبير جداً | 2 | `semantic_analyzer.py (visit_NumberNode)` | — |
| `MB03EB9` | العضو '…' مكرر في التعداد '…' | 2 | `semantic_analyzer.py (visit_EnumDefNode)` | `tests/programs/اخطاء/تعداد_اخطاء.م` |
| `ME751A5` | العملية '…' غير مدعومة للأنواع '…' و '…' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `MD8979A` | الفرع الافتراضي 'حاله _' مكرر | 2 | `semantic_analyzer.py (visit_SwitchNode)` | — |
| `M632DA7` | الفهرس يجب أن يكون عدداً صحيحاً لكن وُجد '…' | 2 | `semantic_analyzer.py (index_low_level)` | — |
| `M93F7B8` | الفهرس … خارج حدود المصفوفة (الحجم …) | 2 | `semantic_analyzer.py (_check_array_bounds)` | — |
| `M2A180B` | القسمة على صفر | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/تشغيل_باقي_على_صفر.م` |
| `ME40F3E` | القيم المسمّاة (اسم = قيمة) لإنشاء الهياكل فقط، و '…' ليس هيكلاً | 2 | `semantic_analyzer.py (visit_FuncCallNode)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `M132AA8` | القيمة من النوع '…' والقائمة عناصرها '…' | 2 | `collection_builtins.py (_check_container_search)` | — |
| `MC71685` | المؤشر من النوع '…' لا يملك حقولاً | 2 | `semantic_analyzer.py (_struct_field)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M17283E` | المتغير '…' غير معرف في هذا النطاق | 2 | `semantic_analyzer.py (undefined_name_error)` | `tests/programs/اخطاء/دلالي_اطبع_وسائط.م` |
| `MA2C966` | المتغير '…' غير معرّف: الإسناد في 'خاتمه' لا يعرّف متغيراً جديداً | 2 | `semantic_analyzer.py (visit_DeferNode)` | `tests/programs/اخطاء/خاتمه_متغير_جديد.م` |
| `M0B0C5C` | المتغير '…' معرّف سابقاً بنوع '…' ولا يمكن إعادة تعريفه بنوع '…' | 2 | `semantic_analyzer.py (visit_AssignNode)` | — |
| `M5AE8B9` | المتغير أو الثابت '…' معرف بالفعل في هذا النطاق | 2 | `semantic_analyzer.py (visit_ConstAssignNode)` | — |
| `M26B95F` | المصفوفات تتطلب عنصراً واحداً على الأقل | 2 | `semantic_analyzer.py (visit_ArrayNode)` | — |
| `M4E6A1F` | المصفوفة مصرّح بأن حجمها … لكن في القيمة … | 2 | `semantic_analyzer.py (list_literal)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MD2F6FB` | المعامل '…' في الدالة الخارجية '…' دالة تستدعيها C: مرّر اسم دالة معرَّفة مباشرة | 2 | `semantic_analyzer.py (analyze_extern_call)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `M0AC501` | المعامل المنطقي '…' يتطلب قيماً منطقية لكن وُجد النوع '…' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | — |
| `M9E63F4` | المقارنة '…' غير مدعومة للنوع '…' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/تعداد_اخطاء.م` |
| `M555F74` | المقارنة المباشرة للقوائم والمصفوفات والقواميس والهياكل غير مدعومة | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | — |
| `M97E208` | الملف المستورد '…' ليس بترميز UTF-8 | 2 | `modules.py (resolve_import)` | — |
| `M1C8CAE` | الملف المستورد غير موجود: … | 2 | `modules.py (locate)` | `tests/programs/متعدد/18_اخطاء_استيراد.م` |
| `MF9B1AB` | الموضع في '…' عدد صحيح لا '…' | 2 | `collection_builtins.py (_require_index)` | `tests/programs/اخطاء/دوال_رئيسية_اخطاء.م` |
| `MEAEBE7` | النوع 'شريحة' يتطلب نوع عناصرها | 2 | `semantic_analyzer.py (resolve_declared)` | — |
| `M8F40A0` | النوع 'مؤشر' يتطلب نوع ما يشير إليه | 2 | `semantic_analyzer.py (resolve_declared)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M604088` | النوع '…' غير محدد بالكامل أو لا يصلح هنا | 2 | `semantic_analyzer.py (type_argument)` | — |
| `MF462D3` | النوع '…' في دالة تُمرَّر إلى C غير مدعوم | 2 | `semantic_analyzer.py (c_type)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `MC40126` | النوع '…' في … للدالة الخارجية '…': … | 2 | `semantic_analyzer.py (c_type)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `MF5480E` | النوع '…' لا يأخذ أنواع عناصر بين قوسين | 2 | `semantic_analyzer.py (resolve_container_type)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M50C199` | النوع '…' لا يدعم الفهرسة | 2 | `semantic_analyzer.py (_index_container_error)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `M4F7188` | النوع '…' لا يملك حقولاً | 2 | `semantic_analyzer.py (_struct_field)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `MA24444` | النوع '…' نوع إرجاع دالة فقط | 2 | `semantic_analyzer.py (resolve_declared)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `M93269E` | النوع '…' نوع عناصر بحجم ثابت: يُكتب داخل مؤشر[...] أو شريحة[...] فقط | 2 | `semantic_analyzer.py (resolve_declared)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `MEDD9F6` | الهيكل '…' غير معرّف | 2 | `semantic_analyzer.py (visit_StructInitNode)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `M2D4431` | الهيكل '…' لا يملك حقلاً باسم '…' | 2 | `semantic_analyzer.py (_struct_field)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `M9E7148` | الهيكل '…' معرَّف بعد '…' ولا يُحتوى بالقيمة قبل تعريفه | 2 | `semantic_analyzer.py (check_field_references)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M1C35E0` | الهيكل '…' معرَّف في أكثر من ملف مستورد: … | 2 | `modules.py (type_name)` | `tests/programs/متعدد/12b_هياكل_خطأ.م` |
| `M7F6FC4` | الهيكل '…' معرّف بالفعل (السطر …) | 2 | `semantic_analyzer.py (visit_StructDefNode)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M579202` | الهيكل '…' يحوي نفسه بالقيمة في الحقل '…' (حجمه يصير لا نهائياً) | 2 | `semantic_analyzer.py (check_field_references)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M7FEA10` | الوحدة '…' غير موجودة | 2 | `modules.py (locate)` | `tests/programs/متعدد/18_اخطاء_استيراد.م` |
| `M9E0887` | الوحدة '…' لا تحوي '…' | 2 | `modules.py (qualified)` | `tests/programs/اخطاء/دلالي_رياضيات.م` |
| `MD6DDCC` | الوحدة '…' لا تحوي هيكلاً باسم '…' | 2 | `modules.py (type_expr)` | `tests/programs/متعدد/12b_هياكل_خطأ.م` |
| `M7ED6C4` | الوحدة '…' ممنوعة بالخيار --no-system | 2 | `semantic_analyzer.py (check_system_imports)` | — |
| `M5A7C77` | الوسيط رقم 1 لـ 'دمج' يجب أن يكون قائمة نصوص لكن وُجد النوع '…' | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `M8B0E9F` | الوسيط رقم … لـ 'دمج_نصوص' من النوع '…' ولا يُدمج في نص | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/نصوص_بمخصص_اخطاء.م` |
| `ME67376` | الوسيط رقم … لـ '…' لا يمكن طباعته: … | 2 | `semantic_analyzer.py (analyze_joined_arg)` | `tests/programs/اخطاء/دلالي_اطبع_وسائط.م` |
| `M55C12E` | الوسيط رقم … لـ '…' من النوع '…' ولا يمكن وضعه في رسالة | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_اطبع_وسائط.م` |
| `MD24354` | الوسيط رقم … لـ '…' يجب أن يكون '…' لا '…' | 2 | `std_intrinsics.py (_expect)` | — |
| `M73E428` | الوسيط رقم … لـ '…' يجب أن يكون من النوع '…' لكن مُرّر '…' | 2 | `semantic_analyzer.py (analyze_indirect_call)` | `tests/programs/اخطاء/مؤشر_داله_اخطاء.م` |
| `M6595D9` | الوسيط رقم … لـ '…' يجب أن يكون نصاً لكن وُجد النوع '…' | 2 | `collection_builtins.py (_require_text)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `M687158` | الوسيط رقم … لـ '…' يجب أن يكون … لكن وُجد النوع '…' | 2 | `builtin_funcs.py (_require)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `M529345` | الوسيط للمعامل '…' في الدالة '…' يجب أن يكون من النوع '…' لكن مُرّر '…' | 2 | `semantic_analyzer.py (analyze_call)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M829064` | الوسيط للمعامل '…' في الدالة الخارجية '…' يجب أن يكون من النوع '…' (…) لكن مُرّر '…' | 2 | `semantic_analyzer.py (analyze_extern_call)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `M3B7138` | الوسيط هنا نوع مكتوب (عدد، بايت، اسم هيكل، مؤشر[...]، شريحة[...]) لا قيمة | 2 | `semantic_analyzer.py (written)` | — |
| `ME29A5E` | تصريح 'خارجي' في المستوى الأعلى من الملف فقط، لا داخل دالة | 2 | `semantic_analyzer.py (visit_ExternFuncNode)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `M3EF2CF` | تصريح 'خارجي' ممنوع بالخيار --no-ffi | 2 | `semantic_analyzer.py (visit_ExternFuncNode)` | `tests/programs/متعدد/23c_خارجي_ممنوع.م` |
| `M45D4E5` | تعذّر تحديد نوع ما تُرجعه الدالة '…' عند هذا الاستدعاء العودي | 2 | `semantic_analyzer.py (analyze_call)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M9235B7` | تعريفك لـ'…'… يحجب '…' المستوردة من '…' في الملف كله، وهو لم يُعرَّف بعد عند هذا السطر | 2 | `semantic_analyzer.py (raise_if_shadowing_definition_comes_later)` | `tests/programs/مكتبة/رياضيات_حجب_قبل_التعريف.م` |
| `M9FC559` | جملة 'استورد' بعد جمل أخرى | 2 | `modules.py (load_module)` | `tests/programs/متعدد/18_اخطاء_استيراد.م` |
| `MB219C3` | جميع عناصر … يجب أن تكون من نفس النوع (متوقع '…' ووجد '…') | 2 | `semantic_analyzer.py (_unify_element_types)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MC64A20` | حجم المصفوفة يجب أن يكون 1 أو أكثر | 2 | `semantic_analyzer.py (resolve_container_type)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MB7FB73` | حجم المصفوفة يجب أن يكون عدداً صحيحاً لكن وُجد '…' | 2 | `semantic_analyzer.py (visit_ArrayNode)` | — |
| `MC96023` | حدود 'مدى' يجب أن تكون أعداداً صحيحة لكن وُجد النوع '…' | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M3A7549` | حدّا القطعة عددان صحيحان لا '…' | 2 | `lowlevel.py (check)` | — |
| `MA3B186` | خطوة 'مدى' لا يمكن أن تكون صفراً | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/تشغيل_خطوة_صفر.م` |
| `M7460FD` | دالة 'طول' تعمل فقط مع القوائم والمصفوفات والقواميس والنصوص لكن وُجد النوع '…' | 2 | `builtin_funcs.py (check)` | — |
| `M393367` | دالة 'طول' لا تعمل مع النوع '…' | 2 | `builtin_funcs.py (emit)` | — |
| `M6C2EE6` | صيغة النوع '…' غير صحيحة | 2 | `semantic_analyzer.py (bad_form)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MAC29B8` | طول الشريحة عدد صحيح لا '…' | 2 | `lowlevel.py (check)` | — |
| `MD7A4EB` | عدد العناصر في '…' عدد صحيح لا '…' | 2 | `lowlevel.py (check)` | — |
| `M8B07C1` | عملية البتات '…' على الأعداد الصحيحة فقط لكن وُجد النوع '…' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/عمليات_البتات_اخطاء.م` |
| `MB1F4F3` | فهرس القائمة أو المصفوفة يجب أن يكون عدداً صحيحاً لكن وُجد '…' | 2 | `semantic_analyzer.py (visit_IndexNode)` | — |
| `M8EDF30` | فهرس النص يجب أن يكون عدداً صحيحاً لكن وُجد '…' | 2 | `semantic_analyzer.py (visit_IndexNode)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `M160243` | قيمة البديل من النوع '…' والتعبير يرجع '…' | 2 | `semantic_analyzer.py (yields_on_every_path)` | — |
| `M64E529` | قيمة الحقل '…' من النوع '…' لكن الحقل في الهيكل '…' من النوع '…' | 2 | `semantic_analyzer.py (analyze_struct_init)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M80BF23` | قيمة حرفية تحجز من الافتراضي | 2 | `semantic_analyzer.py (check_literal_allocation)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `M1C9CF8` | كتلة 'والا' يُنتظر منها قيمة من النوع '…' | 2 | `semantic_analyzer.py (visit_CatchNode)` | `tests/programs/اخطاء/اخطاء_سوء_استعمال.م` |
| `M301C83` | لا تحويل من '…' إلى '…' | 2 | `lowlevel.py (check)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `M10B8D2` | لا تُقارن المؤشرات إلا بـ '==' و '!=' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `ME65EAD` | لا يمكن أن تكون عناصر '…' من النوع '…' | 2 | `semantic_analyzer.py (element)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MF7B743` | لا يمكن أن يكون الحقل '…' من النوع '…' | 2 | `semantic_analyzer.py (struct_field_type)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M109E77` | لا يمكن أن يكون نوع المعامل '…' هو '…' | 2 | `semantic_analyzer.py (visit_FuncDefNode)` | — |
| `MB33C04` | لا يمكن إضافة عنصر إلى المصفوفة … لأن حجمها ثابت | 2 | `builtin_funcs.py (check)` | — |
| `M9819D0` | لا يمكن إنشاء مؤشر إلى 'فراغ' | 2 | `semantic_analyzer.py (analyze_new)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M3822E8` | لا يمكن إنشاء مؤشر إلى 'لاشيء' دون نوع | 2 | `semantic_analyzer.py (analyze_new)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M075B1E` | لا يمكن إنشاء مؤشر إلى '…' | 2 | `semantic_analyzer.py (resolve_container_type)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M6036B2` | لا يمكن إنشاء … من النوع '…': نوع العناصر غير محدد بالكامل | 2 | `semantic_analyzer.py (empty_literal_type)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M6F5E62` | لا يمكن استخدام 'اضف' مع القاموس … | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `ME4A0B2` | لا يمكن استخدام الثابت '…' متغيراً للحلقة | 2 | `semantic_analyzer.py (check_loop_variable)` | `tests/programs/دقة/حلقة_وثابت.م` |
| `MC48BC5` | لا يمكن استخدام النوع 'كسر' في 'حالات' | 2 | `semantic_analyzer.py (visit_SwitchNode)` | `tests/programs/اخطاء/حالات_على_كسر.م` |
| `M7EB8FE` | لا يمكن استخدام النوع '…' في 'حالات' | 2 | `semantic_analyzer.py (visit_SwitchNode)` | `tests/programs/اخطاء/حالات_على_كسر.م` |
| `M6572C4` | لا يمكن الإسناد إلى '….…': ما تصدّره الوحدة '…' ثوابت ودوال وهياكل، ولا يُعدَّل من خارجها | 2 | `modules.py (visit)` | `tests/programs/متعدد/13b_ثوابت_خطأ.م` |
| `MD28FD1` | لا يمكن التكرار على النوع '…' | 2 | `semantic_analyzer.py (visit_ForInNode)` | `tests/programs/اخطاء/دلالي_هل_تقصد.م` |
| `MD3DC2A` | لا يمكن تحرير الثابت '…': 'حرر' يجعل المؤشر لاشيء وهذا تعديل للثابت | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M5F4551` | لا يمكن تحويل النوع '…' إلى عدد | 2 | `builtin_funcs.py (emit)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M427A7E` | لا يمكن تحويل النوع '…' إلى كسر | 2 | `builtin_funcs.py (emit)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `MDD4762` | لا يمكن تحويل … إلى نص | 2 | `builtin_funcs.py (check)` | `tests/programs/اخطاء/دلالي_جمع_نصوص.م` |
| `M46D2CF` | لا يمكن تعديل قيمة الثابت '…' | 2 | `semantic_analyzer.py (visit_AssignNode)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M33F346` | لا يمكن جمع '…' و '…' بـ '+': النوعان مختلفان ولا تحويل تلقائياً | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/تحذيرات.م` |
| `M11E417` | لا يمكن جمع '…' و '…' بـ '+=': النوعان مختلفان ولا تحويل تلقائياً | 2 | `semantic_analyzer.py (visit_AugAssignNode)` | — |
| `M745DE9` | لا يمكن فهرسة مؤشر | 2 | `semantic_analyzer.py (_index_container_error)` | — |
| `M3A570C` | لا يمكن مقارنة أنواع مختلفة '…' و '…' | 2 | `semantic_analyzer.py (visit_BinaryOpNode)` | `tests/programs/اخطاء/تعداد_اخطاء.م` |
| `M9C61F5` | لا يوجد متغير عام باسم '…' | 2 | `semantic_analyzer.py (visit_GlobalDeclNode)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M1ACEE1` | لا … بمخصص صريح لخانة من النوع '…': فيها قيمة مُدارة (نص أو قائمة أو قاموس) | 2 | `semantic_analyzer.py (check_explicit_allocator)` | — |
| `M62BE4D` | متغير الحلقة '…' معرّف سابقاً بالنوع '…' ولا يمكن أن يأخذ عناصر من النوع '…' | 2 | `semantic_analyzer.py (check_loop_variable)` | `tests/programs/دقة/حلقة_وثابت.م` |
| `MF38082` | معامل السالب '-' ينطبق فقط على الأعداد لكن وُجد النوع '…' | 2 | `semantic_analyzer.py (visit_UnaryOpNode)` | — |
| `M3F72EC` | معامل النفي '!' يتطلب قيمة منطقية لكن وُجد النوع '…' | 2 | `semantic_analyzer.py (visit_UnaryOpNode)` | — |
| `M647B8E` | مفتاح القاموس من النوع '…' لا '…' | 2 | `collection_builtins.py (_check_container_search)` | — |
| `M654FFE` | مفتاح القاموس ينبغي أن يكون من النوع '…' وليس '…' | 2 | `semantic_analyzer.py (visit_IndexNode)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `MBDE0E9` | ناتج '…' هنا من النوع 'كسر' ولا يمكن تخزينه في موضع من النوع 'عدد' | 2 | `semantic_analyzer.py (visit_AugAssignNode)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M1B6F8B` | نفي البتات '~' على الأعداد الصحيحة فقط لكن وُجد النوع '…' | 2 | `semantic_analyzer.py (visit_UnaryOpNode)` | `tests/programs/اخطاء/عمليات_البتات_اخطاء.م` |
| `M403B24` | نوع الإرجاع 'لاشيء' غير مدعوم؛ استخدم 'فراغ' للدوال التي لا تُرجع قيمة | 2 | `semantic_analyzer.py (visit_FuncDefNode)` | — |
| `M7571E4` | نوع الإرجاع '…' غير صالح | 2 | `semantic_analyzer.py (resolve_declared)` | — |
| `M88E115` | نوع الإرجاع '…' في '…' غير صالح | 2 | `semantic_analyzer.py (resolve_function_type)` | — |
| `MB6E622` | نوع الحالة '…' لا يطابق نوع التعبير '…' | 2 | `semantic_analyzer.py (visit_SwitchNode)` | — |
| `MB3D1DA` | نوع الحقل '…' غير محدد بالكامل: '…' | 2 | `semantic_analyzer.py (struct_field_type)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M01A00C` | نوع القيمة المرجعة '…' لا يطابق '…' في نوع الإرجاع '!…' للدالة '…' | 2 | `semantic_analyzer.py (fallible_return)` | — |
| `M53E555` | نوع القيمة المرجعة '…' لا يطابق نوع الإرجاع المعلن '…' للدالة '…' | 2 | `semantic_analyzer.py (check_container_return)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `MB51331` | نوع المعامل '…' في '…' غير صالح | 2 | `semantic_analyzer.py (resolve_function_type)` | — |
| `M41D733` | نوع المفتاح '…' غير مدعوم في القواميس | 2 | `semantic_analyzer.py (dict_literal)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M4F07EE` | نوع غير معروف '…' | 2 | `semantic_analyzer.py (resolve_declared)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M5BF391` | نوع ما يشير إليه المؤشر غير محدد بالكامل: '…' | 2 | `semantic_analyzer.py (resolve_container_type)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `MFCFD26` | نوع مفتاح القاموس '…' لا يطابق المتوقع '…' | 2 | `semantic_analyzer.py (visit_IndexAssignNode)` | — |
| `M58270A` | نوع … '…' لا يطابق النوع المحدد '…' | 2 | `semantic_analyzer.py (apply_declared)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M34A51A` | هذا الملف برنامج لا مكتبة: فيه جملة تنفيذية في المستوى الأعلى | 2 | `modules.py (check_library_statements)` | `tests/programs/متعدد/6_مكتبه_سيئة.م` |
| `MD38C50` | وسيط المخصص الأخير لـ '…' متروك | 2 | `semantic_analyzer.py (analyze_call)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |
| `M27955A` | … لا تكون من النوع '…': فيه قيمة مُدارة (نص أو قائمة أو قاموس) | 2 | `semantic_analyzer.py (require_raw_element)` | — |
| `M44E6B2` | … مخصص (من النوع 'مخصص') لا '…' | 2 | `allocators.py (require_allocator)` | `tests/programs/اخطاء/طبقة_منخفضة_اخطاء.م` |
| `M93AAB2` | … يجب أن يكون قيمة منطقية (صواب/خطاء) لكنه من النوع '…' | 2 | `semantic_analyzer.py (check_condition)` | `tests/programs/اخطاء/دلالي_متعدد.م` |
| `M9C9948` | …: الوحدة في وضع بلا_افتراضي (لا حجز من المخصص الافتراضي) | 2 | `semantic_analyzer.py (no_default_error)` | `tests/programs/اخطاء/بلا_افتراضي_اخطاء.م` |

## تحذير

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `MCF65DE` | '…' اسم وحدة قياسية؛ استُوردت القياسية لا الملف … | 0 | `modules.py (locate)` | — |
| `M13EA1E` | '…' ذاكرة يدوية: التحرير المزدوج والاستعمال بعد التحرير لا يُكشفان إلا مع --debug-mem | 0 | `semantic_analyzer.py (analyze_builtin)` | — |
| `MB86D7C` | '…' مذكور في 'خاتمه' تُنفَّذ بعد هذا الإرجاع: قد يرجع ما حرّرته | 0 | `semantic_analyzer.py (visit_ReturnNode)` | `tests/programs/اخطاء/خاتمه_تحذيرات.م` |
| `MD796B9` | إسناد جديد إلى '…' بعد ذكره في 'خاتمه': الخاتمة ستعمل على القيمة الجديدة لا القديمة | 0 | `semantic_analyzer.py (visit_AssignNode)` | `tests/programs/اخطاء/خاتمه_تحذيرات.م` |
| `M9357FC` | الاسم '…' محجوز لدالة مدمجة | 0 | `semantic_analyzer.py (warn_builtin_name)` | `tests/programs/اخطاء/تحذير_اسم_محجوز.م` |
| `MEFA4A0` | الحجم المحدد (…) يختلف عن عدد العناصر (…) | 0 | `semantic_analyzer.py (visit_ArrayNode)` | — |
| `M0F9790` | الحقل '…' في الهيكل '…' بلا نوع: اعتُبر '…'… | 0 | `semantic_analyzer.py (old_field_warning)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `MB61C8D` | الحقل '…' في الهيكل '…' بلا نوع، والهيكل لم يُنشأ فلا يُستنتج نوعه | 0 | `semantic_analyzer.py (finalize)` | `tests/programs/اخطاء/دلالي_هياكل_اسمية.م` |
| `M55F8DC` | الحقل '…' من الهيكل '…' بلا قيمة افتراضية ولم تُمرَّر قيمته | 0 | `semantic_analyzer.py (analyze_struct_init)` | `tests/programs/انواع/هياكل_صيغة_قديمة.م` |
| `M1D3389` | الدالة '…' أُعيد تعريفها | 0 | `semantic_analyzer.py (visit_FuncDefNode)` | — |
| `MB022D1` | الدالة '…' قد تنتهي دون إرجاع قيمة | 0 | `semantic_analyzer.py (visit_FuncDefNode)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M369C95` | القيمة … مكررة في 'حالات' | 0 | `semantic_analyzer.py (visit_SwitchNode)` | — |
| `M9AB401` | المتغير '…' قد يُستخدم هنا قبل إسناد قيمة له | 0 | `semantic_analyzer.py (check_assigned)` | `tests/programs/امان/غير_مهيأ_قائمة.م` |
| `MD698F4` | المفتاح … مكرر في القاموس | 0 | `semantic_analyzer.py (dict_literal)` | — |
| `M57399F` | تعريف … '…' هنا يحجب '…' المستورد من '…' | 0 | `modules.py (warn_shadowed_imports)` | `tests/programs/اخطاء/دلالي_رياضيات.م` |
| `M55073F` | صيغة قديمة لتعريف المصفوفة | 0 | `semantic_analyzer.py (visit_IndexAssignNode)` | `tests/programs/انواع/غموض_الفهرس.م` |
| `MAF7501` | نتيجة 'جديد' مهملة: الخانة لا يمكن الوصول إليها ولا تحريرها بعد هذا السطر | 0 | `semantic_analyzer.py (analyze_statement)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `M84210B` | هذا الإسناد يُنشئ متغيراً محلياً يحجب المتغير العام '…' | 0 | `semantic_analyzer.py (warn_shadowed_global)` | `tests/programs/ميزات/متغيرات_عامة.م` |
| `M9275A2` | هذا التعبير لا يؤدي أي عمل كجملة مستقلة | 0 | `semantic_analyzer.py (analyze_statement)` | `tests/programs/اخطاء/تحذيرات.م` |
| `M47EAAE` | هذا الكود لن يُنفَّذ أبداً | 0 | `semantic_analyzer.py (_analyze_block)` | — |
| `M5761E5` | … '…' … الدالة المدمجة بالاسم نفسه | 0 | `semantic_analyzer.py (warn_builtin_name)` | `tests/programs/اخطاء/تحذير_اسم_محجوز.م` |

## توليد الكود

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `ME4223F` | 'ارجع' خارج دالة | 2 | `codegen.py (_execute_statement)` | — |
| `MF5B1CE` | 'تجاوز' خارج حلقة | 2 | `codegen.py (_execute_statement)` | — |
| `M419341` | 'توقف' خارج حلقة | 2 | `codegen.py (_execute_statement)` | — |
| `MA31AA7` | 'جرّب' في دالة لا ترجع خطأ | 2 | `codegen.py (fail_current)` | — |
| `M12C803` | 'حرر' تتطلب مؤشراً لكن وُجد النوع '…' | 2 | `codegen.py (emit_free)` | — |
| `MFBA4AF` | 'محتوى' تتطلب مؤشراً لكن وُجد النوع '…' | 2 | `codegen.py (deref_slot)` | — |
| `MB66A08` | 'مدى' تتطلب من وسيط واحد إلى ثلاثة وسطاء | 2 | `codegen.py (execute_range_loop)` | — |
| `MC3703C` | استدعاء '…' بلا نسخة دالة من المحلل الدلالي | 2 | `codegen.py (call_function)` | — |
| `MD144C5` | الدالة '…' تتطلب … وسيطاً لكن مُرّر … | 2 | `codegen.py (call_function)` | — |
| `M464EB4` | الدالة أو الهيكل '…' غير معرّف | 2 | `codegen.py (_eval_expr)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `M143A8C` | الدالة من نوع 'فراغ' ولا يمكنها إرجاع قيمة | 2 | `codegen.py (_execute_statement)` | — |
| `M063FFD` | العملية '…' غير مدعومة للأنواع '…' و '…' | 2 | `codegen.py (apply_bin_op)` | `tests/programs/اخطاء/دلالي_خارجي.م` |
| `M827EAE` | العملية '…' غير مدعومة للنوع '…' | 2 | `codegen.py (_eval_expr)` | — |
| `M1ACEC8` | المتغير '…' غير معرف | 2 | `codegen.py (lookup_var)` | `tests/programs/اخطاء/دلالي_اطبع_وسائط.م` |
| `M8E4E02` | المتغير '…' معرف بالفعل ولا يمكن إعادة تعريفه كـ ثابت | 2 | `codegen.py (_execute_statement)` | — |
| `M52A8B2` | المعامل المنطقي '…' يتطلب قيماً منطقية لكن وُجد النوع '…' | 2 | `codegen.py (operand)` | — |
| `M2A701D` | النوع '…' لا يدعم الفهرسة | 2 | `codegen.py (index_slot)` | `tests/programs/اخطاء/دلالي_نصوص_ونسخ.م` |
| `MC061F3` | النوع '…' لا يدعم تعيين الفهرس | 2 | `codegen.py (_execute_statement)` | — |
| `MBEAA1B` | النوع '…' لا يملك حقولاً | 2 | `codegen.py (eval_slot)` | `tests/programs/اخطاء/دلالي_مؤشرات.م` |
| `MC72239` | الهيكل '…' لا يملك حقلاً باسم '…' | 2 | `codegen.py (eval_slot)` | `tests/programs/اخطاء/دلالي_دوال_وهياكل.م` |
| `M08D053` | الهيكل '…' يملك … حقول فقط لكن مُرّر … قيمة | 2 | `codegen.py (_eval_expr)` | — |
| `M7A0F2D` | تعذّر توليد الكود لهذه الجملة (…): … | 2 | `codegen.py (wrap_internal_error)` | — |
| `M2A7A75` | حدود 'مدى' يجب أن تكون أعداداً صحيحة لكن وُجد النوع '…' | 2 | `codegen.py (execute_range_loop)` | `tests/programs/اخطاء/دلالي_مدمجة.م` |
| `M9B342C` | عقدة '…' بلا نوع من المحلل الدلالي (…) | 2 | `codegen.py (sem)` | — |
| `M78A8F6` | فهرس القائمة أو المصفوفة يجب أن يكون عدداً صحيحاً لا '…' | 2 | `codegen.py (index_slot)` | — |
| `M7D4978` | فهرس النص يجب أن يكون عدداً صحيحاً لا '…' | 2 | `codegen.py (eval_string_index)` | — |
| `M0EA83F` | لا نسخة محلَّلة للدالة '…' بالأنواع (…) | 2 | `codegen.py (function_instance)` | — |
| `M2EFD4F` | لا يمكن إعادة تعريف الثابت '…' | 2 | `codegen.py (_execute_statement)` | — |
| `ME404E7` | لا يمكن التكرار على النوع '…' | 2 | `codegen.py (_execute_statement)` | `tests/programs/اخطاء/دلالي_هل_تقصد.م` |
| `M34BFC1` | لا يمكن تحويل النوع '…' إلى '…' | 2 | `codegen.py (coerce)` | — |
| `M2E7341` | لا يمكن تخزين قيمة من النوع 'فراغ' في قاموس | 2 | `codegen.py (dict_runtime)` | — |
| `M4931C1` | لا يمكن تعديل قيمة الثابت '…' | 2 | `codegen.py (_execute_statement)` | `tests/programs/اخطاء/دلالي_دفعة_ا.م` |
| `M28FAFB` | لا يمكن دمج النوع '…' مع النصوص | 2 | `codegen.py (text_pieces)` | — |
| `M68843E` | لا يمكن طباعة قيمة من النوع 'فراغ' | 2 | `codegen.py (emit_print_plain)` | — |
| `M8DE61D` | لا يوجد متغير عام باسم '…' يمكن التصريح به هنا | 2 | `codegen.py (_execute_statement)` | — |
| `ME082C4` | نتيجة هذا الاستدعاء ليست موضعاً يمكن التعديل عليه | 2 | `codegen.py (eval_slot)` | — |
| `ME7DC56` | نوع التعبير '…' غير مدعوم في توليد الكود | 2 | `codegen.py (_eval_expr)` | — |
| `M4AEC5E` | نوع المفتاح '…' غير مدعوم في القواميس | 2 | `codegen.py (dict_runtime)` | `tests/programs/اخطاء/دلالي_انواع.م` |
| `M628195` | هذا التعبير ليس موضعاً يمكن التعديل عليه | 2 | `codegen.py (eval_slot)` | — |
| `MCA0858` | يجب أن تُرجع الدالة قيمة من النوع '…' | 2 | `codegen.py (_execute_statement)` | — |
| `M7F865C` | … يجب أن يكون قيمة منطقية لكنه من النوع '…' | 2 | `codegen.py (eval_condition)` | — |

## تشغيل

| المعرّف | الرسالة | رمز الخروج | المصدر | مثال يسببها |
|---|---|---|---|---|
| `M674C3E` | %.*s | 3 | `builtin_funcs.py (emit)` | — |
| `M5B3D28` | 'نص_سي' على نص قيمته لاشيء (تحقق منه أولاً: س != لاشيء) | 3 | `lowlevel.py (emit)` | `tests/programs/اخطاء/نص_سي_لاشيء.م` |
| `M612827` | الشريحة أطول من كتلتها: طولها %lld عنصراً والكتلة %lld بايتاً | 3 | `lowlevel.py (emit)` | — |
| `M791C40` | الفهرس %lld خارج الحدود (الحجم %lld) | 3 | `codegen.py (emit_bounds_check)` | `tests/programs/اخطاء/تشغيل_فهرس_خارج_الحدود.م` |
| `M765E66` | الفهرس %lld خارج الكتلة (عدد عناصرها %lld) | 3 | `codegen.py (low_level_slot)` | `tests/programs/كشف_الذاكرة/كتلة_فهرس_خارجها.م` |
| `M4D73CB` | الفهرس %lld خارج حدود الشريحة (طولها %lld) | 3 | `codegen.py (low_level_slot)` | `tests/programs/اخطاء/تشغيل_شريحة_حدود.م` |
| `M7D5601` | الفهرس %lld خارج حدود القائمة (طولها %lld) | 3 | `collection_builtins.py (_emit_list_remove)` | `tests/programs/اخطاء/احذف_خارج_القائمة.م` |
| `M4CFD27` | الفهرس %lld خارج حدود النص (الطول %lld) | 3 | `codegen.py (eval_string_index)` | `tests/programs/اخطاء/تشغيل_فهرس_نص.م` |
| `M52A654` | القطعة من %lld إلى %lld خارج الشريحة (طولها %lld) | 3 | `lowlevel.py (emit)` | — |
| `M394B08` | القيمة %lld التي أرجعتها الدالة '…' خارج مدى '…' الذي تنتظره C | 3 | `codegen.py (c_callback)` | `tests/programs/اخطاء/استدعاء_عكسي_مدى.م` |
| `M4F46F4` | القيمة %lld خارج مدى '…' (من … إلى …) | 3 | `lowlevel.py (emit)` | `tests/programs/اخطاء/تشغيل_تحويل_خارج_المدى.م` |
| `M27A349` | القيمة %lld خارج مدى النوع '…' للمعامل '…' في الدالة الخارجية '…' | 3 | `codegen.py (call_extern)` | `tests/programs/خارجي/مدى_النوع.م` |
| `MABFA7D` | القيمة %lld سالبة: خارج مدى '…' | 3 | `lowlevel.py (emit)` | — |
| `M1C4C8F` | القيمة %lld سالبة: لا تُكتب في '…' | 3 | `codegen.py (store_element)` | `tests/programs/اخطاء/تشغيل_طبيعي64_سالب.م` |
| `M3913F0` | القيمة أكبر من مدى '…' | 3 | `lowlevel.py (emit)` | — |
| `MCA1FA4` | القيمة في '…' أكبر من أن تتسع في عدد (أكبر من 9223372036854775807) | 3 | `codegen.py (load_element)` | `tests/programs/اخطاء/تشغيل_طبيعي64_لا_يتسع.م` |
| `M163FD0` | المتغير '…' استُخدم قبل إسناد قيمة له | 3 | `codegen.py (_eval_expr)` | `tests/programs/امان/غير_مهيأ_قائمة.م` |
| `M760709` | المخصص أُعيد بـ 'اعد' من قبل | 3 | `allocators.py (emit)` | `tests/programs/اخطاء/تشغيل_مخصص_اعد_مرتين.م` |
| `MEBC802` | المفتاح %lld غير موجود في القاموس | 3 | `codegen.py (emit_missing_key_error)` | — |
| `M8B0091` | المفتاح '%s' غير موجود في القاموس | 3 | `codegen.py (emit_missing_key_error)` | `tests/programs/اخطاء/تشغيل_حذف_مفتاح_غير_موجود.م` |
| `MA07661` | النظام والافتراضي لا يُعادان: 'اعد' للساحة والكاشف | 3 | `allocators.py (emit)` | `tests/programs/اخطاء/تشغيل_اعد_النظام.م` |
| `M7CE7AC` | انتهت الدالة '…' دون إرجاع قيمة من النوع '…' (أضف 'ارجع' في كل المسارات) | 3 | `codegen.py (function_instance)` | `tests/programs/امان/دالة_بلا_ارجاع_قائمة.م` |
| `MB57F21` | تجاوز العدد الصحيح حدود 64 بت في العملية '…' (للالتفاف بدل الخطأ شغّل مع --wrap-overflow) | 3 | `codegen.py (int_arith)` | `tests/programs/دقة/تجاوز_جمع.م` |
| `M430A1A` | تحرير بالمخصص الافتراضي لخانة حُجزت من مخصص آخر: حرّرها به، حرر(المؤشر, المخصص) | 3 | `codegen.py (emit_free)` | `tests/programs/كشف_الذاكرة/مخصصات_مالك_اخر.م` |
| `M839809` | تحرير جزء من كتلة: حرّر الشريحة التي أرجعها احجز كاملة | 3 | `codegen.py (emit_free)` | `tests/programs/اخطاء/تشغيل_تحرير_جزء_من_كتلة.م` |
| `M4B8618` | تحرير جزء من نص: حرّر النص الذي يملأ مخزنه (لا جزءاً منه ولا نصاً أُلحق بعده) | 3 | `codegen.py (emit_free_str)` | `tests/programs/اخطاء/تشغيل_تحرير_جزء_من_نص.م` |
| `MCBCD7A` | تحرير حاوية بمخصص غير الذي حجزها | 3 | `codegen.py (emit_free_container)` | `tests/programs/اخطاء/تشغيل_تحرير_حاوية_بمخصص_اخر.م` |
| `M09CDB6` | تحرير حاوية قيمتها لاشيء (هل حُرّرت من قبل؟) | 3 | `codegen.py (emit_free_container)` | `tests/programs/اخطاء/تشغيل_تحرير_حاوية_مرتين.م` |
| `M1F9AA3` | تحرير شريحة لا تملك كتلة (فارغة، أو حُرّرت من قبل، أو من شريحة_خام) | 3 | `codegen.py (emit_free)` | — |
| `M5904F0` | تحرير مؤشر قيمته لاشيء (هل حُرّر من قبل؟) | 3 | `codegen.py (emit_free)` | `tests/programs/مؤشرات/حرر_مرتين.م` |
| `M63CF46` | تحرير مزدوج: الحاوية حُرّرت من قبل (عبر اسم آخر يحملها) | 3 | `codegen.py (emit_free_container)` | `tests/programs/كشف_الذاكرة/حاوية_تحرير_مزدوج.م` |
| `ME34445` | تحرير نص لا يملك مخزناً (نص حرفيّ، أو لاشيء، أو حُرّر من قبل) | 3 | `codegen.py (emit_free_str)` | — |
| `M85DF20` | حوّل: حجم الشريحة %lld بايتاً لا ينقسم على حجم العنصر الجديد %lld | 3 | `lowlevel.py (emit)` | — |
| `M974086` | خطأ لم يُعالَج: %s | 3 | `codegen.py (fail_current)` | `tests/programs/اخطاء/تشغيل_تحويل_كسر.م` |
| `MFB7984` | خطوة 'مدى' لا يمكن أن تكون صفراً | 3 | `codegen.py (execute_range_loop)` | `tests/programs/اخطاء/تشغيل_خطوة_صفر.م` |
| `MA6200B` | رياضيات.جذر: لا جذر تربيعي لعدد سالب | 3 | `stdlib/رياضيات.م` | `tests/programs/مكتبة/رياضيات_جذر_سالب.م` |
| `M43D8D9` | رياضيات.جيب_تمام_عكسي: القيمة يجب أن تكون بين -1 و 1 | 3 | `stdlib/رياضيات.م` | — |
| `ME86276` | رياضيات.جيب_عكسي: القيمة يجب أن تكون بين -1 و 1 | 3 | `stdlib/رياضيات.م` | `tests/programs/مكتبة/رياضيات_جيب_عكسي_خارج.م` |
| `MD43DC7` | رياضيات.قرب_الى: عدد الخانات يجب أن يكون بين 0 و 15 | 3 | `stdlib/رياضيات.م` | `tests/programs/مكتبة/رياضيات_خانات_خاطئة.م` |
| `M333587` | رياضيات.لوغاريتم10: لا لوغاريتم لعدد غير موجب | 3 | `stdlib/رياضيات.م` | `tests/programs/مكتبة/رياضيات_لوغاريتم_صفر.م` |
| `M126D62` | رياضيات.لوغاريتم2: لا لوغاريتم لعدد غير موجب | 3 | `stdlib/رياضيات.م` | — |
| `MBE4A60` | رياضيات.لوغاريتم: لا لوغاريتم لعدد غير موجب | 3 | `stdlib/رياضيات.م` | — |
| `M1ABD93` | رياضيات.نسق: عدد الخانات يجب أن يكون بين 0 و100 | 3 | `stdlib/رياضيات.م` | — |
| `MAE7C6B` | شريحة_خام: طول سالب، أو مؤشر لاشيء بطول %lld | 3 | `lowlevel.py (emit)` | — |
| `M5C02FA` | طول الشريحة %lld سالب | 3 | `lowlevel.py (emit)` | — |
| `M848FD6` | عدد عناصر الكتلة %lld غير صالح (سالب أو أكبر من الممكن) | 3 | `lowlevel.py (allocate_block)` | — |
| `M24A5DC` | عشوائي.صحيح: الحد الأدنى أكبر من الحد الأعلى | 3 | `stdlib/عشوائي.م` | — |
| `M7E86C9` | فك مؤشر قيمته لاشيء (تحقق منه أولاً: المؤشر != لاشيء) | 3 | `codegen.py (require_pointer)` | `tests/programs/مؤشرات/استعمال_بعد_حرر.م` |
| `M89D476` | لا يمكن استخدام نص قيمته لاشيء هنا (تحقق منه أولاً: س != لاشيء) | 3 | `collection_builtins.py (_text)` | `tests/programs/امان/نص_لاشيء_دالة_نصية.م` |
| `M88F899` | لا يمكن تحويل الكسر %s إلى عدد: خارج مدى الأعداد الصحيحة أو ليس عدداً | 3 | `builtin_funcs.py (emit)` | `tests/programs/دقة/عدد_من_غير_عددي.م` |
| `M6471A3` | مقدار الإزاحة %lld خارج المدى من 0 إلى 63 | 3 | `codegen.py (apply_bin_op)` | `tests/programs/اخطاء/تشغيل_ازاحة_خارج_المدى.م` |
| `MC587FD` | ملفات.… | 3 | `stdlib/ملفات.م` | — |
| `MCEFDC2` | موضع الإدراج %lld خارج القائمة (من 0 إلى %lld) | 3 | `collection_builtins.py (emit)` | — |
| `MD6583F` | ناتج '…' خارج مدى الأعداد الصحيحة: أصغر عدد صحيح مع المقسوم عليه -1 | 3 | `codegen.py (apply_bin_op)` | `tests/programs/امان/باقي_اصغر_عدد.م` |
| `MC55759` | نظام.التاريخ: تعذّر تحويل الوقت إلى التاريخ المحلي | 3 | `stdlib/نظام.م` | — |
| `MD0889E` | نظام.انهِ: رمز الخروج يجب أن يكون بين 0 و255 | 3 | `stdlib/نظام.م` | — |
| `ME2FCFD` | نفدت الذاكرة: تعذّر إنشاء المخصص | 3 | `allocators.py (create)` | — |
| `M227660` | نفدت الذاكرة: تعذّر حجز %lld بايتاً من المخصص | 3 | `allocators.py (allocate)` | — |
| `M5FE11D` | نفدت الذاكرة: تعذّر حجز كتلة من %lld عنصراً | 3 | `lowlevel.py (allocate_block)` | `tests/programs/اخطاء/تشغيل_مخزن_ثابت_ممتلئ.م` |
| `M7253F1` | … من مخصص أُعيد بـ 'اعد' | 3 | `allocators.py (require_live)` | `tests/programs/اخطاء/تشغيل_مخصص_بعد_اعد.م` |

الرسائل: 374، ولها مثال من البرامج المرجعية: 228.
