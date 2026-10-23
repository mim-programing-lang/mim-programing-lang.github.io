# صورة اختبار الاتجاه: Xvfb (من localhost/mce-xserver) ومكتبات Chromium. المتصفح نفسه و node يُركَّبان من الجهاز للقراءة.
FROM localhost/mce-xserver
RUN apt-get update && apt-get install -y --no-install-recommends \
      libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libatspi2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2t64 \
      libdbus-1-3 libxshmfence1 libgtk-3-0t64 \
    && rm -rf /var/lib/apt/lists/*
