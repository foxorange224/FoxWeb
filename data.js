const FoxWebDB = {
programas: [
{
name: "Office Professional 2016",
icon: "fa-brands fa-windows",
info: "Microsoft Office o conocido actualmente como Microsoft 365, es una suite ofimática de aplicaciones para computadoras de escritorio",
enlace: "https://www.mediafire.com/file/jcqeb11nhj4hs31",
modal: null,
badges: ["OFIMÁTICA","ESTUDIO","SUITE"]
},
{
name: "Krita",
icon: "fa-solid fa-paintbrush",
info: "Software de pintura digital y animación de código abierto. Alternativa gratuita a Photoshop para artistas digitales.",
enlace: "https://krita.org/es/download/",
modal: null,
badges: ["DISEÑO","PINTURA DIGITAL","OPEN SOURCE"]
},
{
name: "VLC Media Player",
icon: "fa-solid fa-compact-disc",
info: "El reproductor multimedia universal. Reproduce cualquier formato de video o audio sin necesidad de instalar códecs adicionales.",
enlace: "#",
modal: "vlcModal",
badges: ["MULTIMEDIA","UNIVERSAL"]
},
{
name: "7-Zip",
icon: "fa-solid fa-file-zipper",
info: "Compresor de archivos de alto rendimiento y código abierto. Soporta formatos como 7z, ZIP, RAR, TAR y GZIP.",
enlace: "https://www.7-zip.org/download.html",
modal: null,
badges: ["COMPRESIÓN","OPEN SOURCE"]
},
{
name: "Notepad++",
icon: "fa-solid fa-file-code",
info: "Editor de texto y código fuente potente y ligero. Ideal para programadores, con soporte para múltiples lenguajes y plugins.",
enlace: "https://github.com/notepad-plus-plus/notepad-plus-plus/releases/latest",
modal: null,
badges: ["EDITOR","PROGRAMACIÓN"]
},
{
name: "BalenaEtcher",
icon: "fa-solid fa-hard-drive",
info: "Herramienta confiable para grabar imágenes de sistema (ISO, IMG) en unidades USB o tarjetas SD de forma segura y sencilla.",
enlace: "https://etcher.balena.io/",
modal: null,
badges: ["USB","HERRAMIENTA"]
},
{
name: "ShareX",
icon: "fa-solid fa-camera",
info: "Suite de captura de pantalla y grabación avanzada. Captura, anota, graba GIFs y sube automáticamente a la nube.",
enlace: "https://getsharex.com/",
modal: null,
badges: ["CAPTURA","PRODUCTIVIDAD"]
},
{
name: "Java Runtime",
icon: "fa-brands fa-java",
info: "Entorno de ejecución necesario para usar aplicaciones y juegos desarrollados en Java. Selecciona tu versión.",
enlace: "#",
modal: "javaModal",
badges: ["RUNTIME","ESENCIAL"]
},
{
name: "LibreOffice",
icon: "fa-solid fa-file-word",
info: "Suite ofimática completa y gratuita. Incluye procesador de texto, hojas de cálculo, presentaciones y más.",
enlace: "https://www.libreoffice.org/download/download-libreoffice/",
modal: null,
badges: ["OFIMÁTICA","PRODUCTIVIDAD","GRATUITO"]
},
{
name: "CCleaner",
icon: "fa-solid fa-broom",
info: "Herramienta de limpieza y optimización del sistema. Elimina archivos temporales y entradas de registro innecesarias.",
enlace: "https://www.ccleaner.com/ccleaner/download",
modal: null,
badges: ["LIMPIEZA","OPTIMIZACIÓN"]
},
{
name: "Audacity",
icon: "fa-solid fa-wave-square",
info: "Editor de audio gratuito y de código abierto. Graba, edita y mezcla pistas de audio de forma profesional.",
enlace: "https://www.audacityteam.org/download/",
modal: null,
badges: ["AUDIO","EDITOR","OPEN SOURCE"]
},
{
name: "GIMP",
icon: "fa-solid fa-image",
info: "Editor de imágenes de código abierto. Potente alternativa a Photoshop con soporte para capas, filtros y scripts.",
enlace: "https://www.gimp.org/downloads/",
modal: null,
badges: ["EDICIÓN","FOTOS","OPEN SOURCE"]
},
{
name: "Inkscape",
icon: "fa-solid fa-draw-polygon",
info: "Editor de gráficos vectoriales profesional. Crea logotipos, ilustraciones, diagramas y más. Alternativa a Illustrator.",
enlace: "https://inkscape.org/release/",
modal: null,
badges: ["VECTORES","DISEÑO","OPEN SOURCE"]
},
{
name: "DaVinci Resolve",
icon: "fa-solid fa-film",
info: "Software profesional de edición de video, colorización y postproducción. Versión gratuita con funciones completas.",
enlace: "https://www.blackmagicdesign.com/products/davinciresolve/",
modal: null,
badges: ["VIDEO","EDICIÓN","PROFESIONAL"]
},
{
name: "OBS Studio",
icon: "fa-solid fa-video",
info: "Software de grabación y transmisión en vivo. Gratuito y open source para streamers, youtubers y creadores.",
enlace: "https://obsproject.com/download",
modal: null,
badges: ["STREAMING","GRABACIÓN","OPEN SOURCE"]
},
{
name: "Visual Studio Code",
icon: "fa-solid fa-code",
info: "Editor de código fuente ligero pero potente. Soporte para múltiples lenguajes, debugging y control de Git integrado.",
enlace: "https://code.visualstudio.com/Download",
modal: null,
badges: ["PROGRAMACIÓN","EDITOR","GRATUITO"]
},
{
name: "Git",
icon: "fa-brands fa-git-alt",
info: "Sistema de control de versiones distribuido. Esencial para desarrolladores para gestionar código y colaborar.",
enlace: "https://git-scm.com/downloads",
modal: null,
badges: ["CONTROL VERSIONES","DESARROLLO","OPEN SOURCE"]
},
{
name: "Python",
icon: "fa-brands fa-python",
info: "Lenguaje de programación interpretado. Simple, potente y popular para ciencia de datos, IA, web y automatización.",
enlace: "https://www.python.org/downloads/",
modal: null,
badges: ["PROGRAMACIÓN","LENGUAJE","OPEN SOURCE"]
},
{
name: "Node.js",
icon: "fa-brands fa-node-js",
info: "Entorno de ejecución para JavaScript del lado del servidor. Ideal para aplicaciones web escalables y APIs.",
enlace: "https://nodejs.org/en/download/",
modal: null,
badges: ["JAVASCRIPT","SERVER","OPEN SOURCE"]
},
{
name: "XAMPP",
icon: "fa-solid fa-server",
info: "Paquete de servidor web Apache con PHP, MySQL y Perl. Entorno de desarrollo web local completo y gratuito.",
enlace: "https://www.apachefriends.org/download.html",
modal: null,
badges: ["WEB","DESARROLLO","SERVIDOR"]
},
{
name: "Everything",
icon: "fa-solid fa-search",
info: "Motor de búsqueda de archivos instantáneo para Windows. Encuentra cualquier archivo en segundos.",
enlace: "https://www.voidtools.com/downloads/",
modal: null,
badges: ["BÚSQUEDA","PRODUCTIVIDAD","RÁPIDO"]
},
{
name: "Greenshot",
icon: "fa-solid fa-camera",
info: "Herramienta de captura de pantalla ligera y potente. Captura, anota y comparte fácilmente.",
enlace: "https://getgreenshot.org/downloads/",
modal: null,
badges: ["CAPTURA","PRODUCTIVIDAD","OPEN SOURCE"]
},
{
name: "KeePassXC",
icon: "fa-solid fa-key",
info: "Gestor de contraseñas seguro y de código abierto. Almacena tus contraseñas en una base de datos encriptada.",
enlace: "https://keepassxc.org/download/",
modal: null,
badges: ["SEGURIDAD","CONTRASEÑAS","OPEN SOURCE"]
},
{
name: "CrystalDiskMark",
icon: "fa-solid fa-hard-drive",
info: "Benchmark para medir velocidad de lectura/escritura de discos duros y SSD. Simple y efectivo.",
enlace: "https://crystalmark.info/en/software/crystaldiskmark/",
modal: null,
badges: ["BENCHMARK","DISCO","DIAGNÓSTICO"]
},
{
name: "FileZilla",
icon: "fa-solid fa-server",
info: "Cliente FTP, SFTP y FTPS gratuitos. Transfiere archivos de forma rápida y segura entre tu PC y servidores web.",
enlace: "https://filezilla-project.org/download.php",
modal: null,
badges: ["FTP","TRANSFERENCIA"]
},
{
name: "Malwarebytes",
icon: "fa-solid fa-shield-alt",
info: "Potente antivirus y anti-malware que protege contra amenazas avanzadas, ransomware y sitios web maliciosos.",
enlace: "https://es.malwarebytes.com/",
modal: null,
badges: ["ANTIVIRUS","SEGURIDAD","PROTECCIÓN"]
},
{
name: "qBittorrent",
icon: "fa-solid fa-download",
info: "Cliente de BitTorrent gratuitos, de código abierto y sin anuncios. Interfaz clara y bajo consumo de recursos.",
enlace: "https://www.qbittorrent.org/",
modal: null,
badges: ["TORRENT","DESCARGAS","OPEN SOURCE"]
}
],
sistemas: [
{
name: "Debian 13",
icon: "fa-brands fa-linux",
info: "Instalador por red de la versión estable de Debian para PCs de 64 bits. Sistema Linux robusto y confiable.",
enlace: "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-13.2.0-amd64-netinst.iso",
modal: null,
badges: ["LINUX","ESTABLE","OFICIAL"]
},
{
name: "Hiren's BootCD 15.2",
icon: "fa-solid fa-toolbox",
info: "Kit de rescate esencial con más de 100 herramientas para reparación, diagnóstico y recuperación de sistemas Windows.",
enlace: "https://www.mediafire.com/file/rd2plfxcwhocbd8/Hiren%2527s.BootCD.15.2.iso/file",
modal: null,
badges: ["RESCATE","HERRAMIENTAS","DIAGNÓSTICO"]
},
{
name: "Loc-OS Linux 23",
icon: "fa-brands fa-linux",
info: "Distribución Linux muy ligera, ideal para darle vida a hardware antiguo. Incluye las aplicaciones básicas necesarias.",
enlace: "#",
modal: "locosModal",
badges: ["LINUX","LIGERO","HARDWARE ANTIGUO"]
},
{
name: "Linux Mint 22.2",
icon: "fa-brands fa-linux",
info: "Sistema operativo de escritorio amigable y completamente equipado. Perfecto para usuarios que vienen de Windows.",
enlace: "https://linuxmint.com/download.php",
modal: null,
badges: ["LINUX","ESCRITORIO","AMIGABLE"]
},
{
name: "ReactOS",
icon: "fa-brands fa-windows",
info: "Sistema operativo de código abierto compatible con programas y controladores de Windows. Alternativa libre a Windows.",
enlace: "https://reactos.org/",
modal: null,
badges: ["OPEN SOURCE","COMPATIBLE WINDOWS"]
},
{
name: "Ubuntu MATE",
icon: "fa-brands fa-ubuntu",
info: "Distribución Linux estable y eficiente con escritorio MATE. Perfecta para revivir PCs antiguos con buen soporte.",
enlace: "https://ubuntu-mate.org/download/",
modal: null,
badges: ["LINUX","ESTABLE","LIGERO"]
},
{
name: "GParted Live",
icon: "fa-solid fa-hard-drive",
info: "ISO live para gestionar particiones de disco. Redimensiona, copia, formatea y recupera particiones sin instalar sistema.",
enlace: "https://gparted.org/download.php",
modal: null,
badges: ["PARTICIONES","RESCATE","HERRAMIENTA"]
},
{
name: "Ventoy",
icon: "fa-solid fa-layer-group",
info: "Crea un USB booteable y copia múltiples archivos ISO a la vez. Arranca cualquier sistema desde un solo dispositivo USB.",
enlace: "https://www.ventoy.net/en/download.html",
modal: null,
badges: ["USB","MULTI-ISO","HERRAMIENTA"]
}
],
juegos: [
{
name: "Papa's Pizzeria Collection",
icon: "fa-solid fa-pizza-slice",
info: "Un pack de juegos de cocina que marcó la infancia. Gestiona tu propio restaurante de pizzas con muchos ingredientes.",
enlace: "https://www.mediafire.com/file/cpcxasi9cbernjs",
modal: null,
badges: ["COCINA","CLÁSICO","GESTIÓN"]
},
{
name: "Counter Strike 1.6",
icon: "fa-solid fa-crosshairs",
info: "El clásico de disparos tácticos que definió un género. Multijugador competitivo y miles de servidores activos.",
enlace: "https://www.mediafire.com/file/be2cr8yfize0w73/CS1.6.zip/file",
modal: null,
badges: ["FPS","MULTIJUGADOR","CLÁSICO"]
},
{
name: "Geometry Dash 2.207",
icon: "fa-solid fa-gear",
info: "Juego de ritmo y plataformas desafiante. Supera obstáculos al compás de la música y crea tus propios niveles.",
enlace: "https://www.mediafire.com/file/jfpbza89296aoba/GD-2.2074-%252864-Bits%2529.zip/file",
modal: null,
badges: ["RITMO","PLATAFORMAS","DESAFÍO"]
},
{
name: "Half Life 1",
icon: "fa-solid fa-radiation",
info: "El revolucionario shooter en primera persona que cambió los videojuegos. Una aventura de ciencia ficción épica.",
enlace: "https://www.mediafire.com/file/fpam0fdospuupxb/HL.zip/file",
modal: null,
badges: ["FPS","CIENCIA FICCIÓN","CLÁSICO"]
},
{
name: "Steam",
icon: "fa-brands fa-steam",
info: "Plataforma de distribución digital de videojuegos. Miles de juegos, comunidad y funciones sociales.",
enlace: "https://store.steampowered.com/about/",
modal: null,
badges: ["JUEGOS","PLATAFORMA","GRATUITO"]
},
{
name: "RetroArch",
icon: "fa-solid fa-gamepad",
info: "Frontend para emuladores y juegos retro. Soporta múltiples consolas y sistemas en una interfaz unificada.",
enlace: "https://www.retroarch.com/?page=platforms",
modal: null,
badges: ["EMULADOR","RETRO","OPEN SOURCE"]
},
{
name: "Assault Cube",
icon: "fa-solid fa-cube",
info: "Shooter FPS gratuitos, de código abierto, estilo Counter-Strike. Multijugador online y offline con bots.",
enlace: "https://assault.cubers.net/download.html",
modal: null,
badges: ["FPS","OPEN SOURCE","MULTIJUGADOR"]
},
{
name: "OpenTTD",
icon: "fa-solid fa-train",
info: "Simulador de transporte de código abierto. Construye y gestiona tu imperio de trenes, barcos y aviones.",
enlace: "https://www.openttd.org/downloads/openttd-releases/latest.html",
modal: null,
badges: ["SIMULACIÓN","OPEN SOURCE","GESTIÓN"]
},
{
name: "SuperTuxKart",
icon: "fa-solid fa-trophy",
info: "Juego de carreras de karts en 3D, gratis y de código abierto. Divertido, con varios personajes y pistas.",
enlace: "https://supertuxkart.net/Download",
modal: null,
badges: ["CARRERAS","MULTIJUGADOR","OPEN SOURCE"]
},
{
name: "Legacy Launcher",
icon: "fa-solid fa-cubes",
info: "Lanzador alternativo para Minecraft Java Edition. Estable, rápido y con soporte para versiones antiguas del juego.",
enlace: "https://llaun.ch/es",
modal: null,
badges: ["LAUNCHER","MINECRAFT"]
}
],
extras: [
{
name: "Java para Windows",
icon: "fa-brands fa-java",
info: "Entorno de ejecución necesario para aplicaciones y juegos desarrollados en Java. Selecciona tu versión.",
enlace: "#",
modal: "javaModal",
badges: ["RUNTIME","ESENCIAL","WINDOWS"]
},
{
name: "Instalador de Dependecias",
icon: "fa-solid fa-puzzle-piece",
info: "Instala automáticamente todos los requisitos (.NET, Visual C++, XNA, DirectX) para que programas y juegos funcionen.",
enlace: "https://www.mediafire.com/file/nii3ncqlxe1mezx/Instalador+de+Dependecias.7z/file",
modal: null,
badges: ["RUNTIME","ESENCIAL","WINDOWS"]
},
{
name: "Rufus (Portable)",
icon: "fa-brands fa-usb",
info: "Herramienta ligera y rápida para crear unidades USB de arranque desde imágenes ISO. No requiere instalación.",
enlace: "https://rufus.ie/downloads/",
modal: null,
badges: ["USB","HERRAMIENTA","PORTABLE"]
},
{
name: "Tema Windows 10 para 7",
icon: "fa-solid fa-paint-roller",
info: "Transforma la apariencia de tu Windows 7 para que se vea como Windows 10. Incluye iconos, colores y efectos.",
enlace: "https://www.mediafire.com/file/a0l5lnbd56jyady/Tema_de_Windows_10_para_Windows_7_por_FoxOrange224.zip/file",
modal: null,
badges: ["PERSONALIZACIÓN","TEMAS","WINDOWS 7"]
},
{
name: "DriverPack para Windows XP",
icon: "fa-solid fa-microchip",
info: "Paquete completo de controladores para hardware difícil de encontrar en sistemas Windows XP de 32 bits (x86).",
enlace: "https://www.mediafire.com/file/65acrgovcx0ypkt/DriverPack_XP_%2528x86%2529.rar/file",
modal: null,
badges: ["DRIVERS","WINDOWS XP","COMPATIBILIDAD"]
},
{
name: "3DP Chip",
icon: "fa-solid fa-gears",
info: "Identifica automáticamente el hardware de tu PC y descarga los controladores necesarios de forma rápida y sencilla.",
enlace: "https://www.3dpchip.com/",
modal: null,
badges: ["DRIVERS","DETECCIÓN","AUTOMÁTICO"]
},
{
name: "CPU-Z",
icon: "fa-solid fa-microchip",
info: "Muestra información detallada sobre los componentes de tu sistema: procesador, placa base, memoria RAM y gráficos.",
enlace: "https://www.cpuid.com/softwares/cpu-z.html",
modal: null,
badges: ["DIAGNÓSTICO","HARDWARE","INFORMACIÓN"]
},
{
name: "CrystalDiskInfo",
icon: "fa-solid fa-hard-drive",
info: "Monitoriza la salud de tus discos duros y SSD. Muestra temperatura, horas de uso y alerta de posibles fallos.",
enlace: "https://crystalmark.info/en/software/crystaldiskinfo/",
modal: null,
badges: ["MONITOREO","DISCO","SALUD"]
},
{
name: "Driver Booster (Versión 10.3)",
icon: "fa-solid fa-gears",
info: "Herramienta especial para actualizar controladores en sistemas antiguos. Compatible con Windows XP y hardware difícil.",
enlace: "#",
modal: "driverBoosterModal",
badges: ["DRIVERS","WINDOWS XP","COMPATIBILIDAD"]
},
{
name: "Smart Defrag (Versión 11)",
icon: "fa-solid fa-gears",
info: "Herramienta especial para optimizar y defragmentar el disco. Compatible con Windows XP hasta el actual.",
enlace: "https://www.mediafire.com/file/1su7mvz3z97s4bc/Smart+Defrag+11.1.0.466.zip/file",
modal: null,
badges: ["DISCOS","DESFRAGMENTAR","HDD"]
}
],
apks: [
{
name: "Minecraft Bedrock",
icon: "fa-solid fa-cube",
info: "La versión oficial de Minecraft para móviles. Construye, explora y sobrevive en mundos infinitos con todas las características.",
enlace: "https://www.mediafire.com/file/xc2yuu97tbyclf7/mc-be-1.21.130.apk/file",
modal: null,
badges: ["JUEGO","SANDBOX","OFICIAL"]
},
{
name: "Geometry Dash (2.207)",
icon: "fa-solid fa-gear",
info: "Versión modificada con Geode Mod Loader. Salta y vuela al ritmo de la música en este desafío de plataformas y ritmo.",
enlace: "https://bruhzstudios.itch.io/free-gd-geode-breeze-apks-mobile-only",
modal: null,
badges: ["JUEGO","RITMO","MOD"]
},
{
name: "PPSSPP",
icon: "fa-solid fa-gamepad",
info: "Emulador de PSP (PlayStation Portable) para Android. Juega tus títulos favoritos de PSP en tu móvil con alta compatibilidad.",
enlace: "https://www.ppsspp.org/files/1_19_3/ppsspp.apk",
modal: null,
badges: ["EMULADOR","JUEGOS","PSP"]
},
{
name: "Termux",
icon: "fa-solid fa-terminal",
info: "Emulador de terminal y entorno Linux para Android. Ejecuta comandos, instala paquetes y realiza tareas de desarrollo.",
enlace: "https://f-droid.org/repo/com.termux_1002.apk",
modal: null,
badges: ["TERMINAL","LINUX","DESARROLLO"]
},
{
name: "F-Droid",
icon: "fa-solid fa-store",
info: "Tienda de aplicaciones de código abierto para Android. Encuentra apps gratuitas, libres y sin anuncios ni rastreo.",
enlace: "https://f-droid.org/",
modal: null,
badges: ["TIENDA","OPEN SOURCE","PRIVACIDAD"]
},
{
name: "NewPipe",
icon: "fa-brands fa-youtube",
info: "Cliente alternativo de YouTube. Sin anuncios, reproduce en segundo plano, descarga videos y no requiere cuenta de Google.",
enlace: "https://newpipe.net/",
modal: null,
badges: ["VIDEO","PRIVACIDAD","ALTERNATIVA"]
},
{
name: "Kiwi Browser",
icon: "fa-solid fa-globe",
info: "Navegador web basado en Chromium que permite instalar extensiones de Chrome de escritorio. Rápido y personalizable.",
enlace: "https://kiwibrowser.com/",
modal: null,
badges: ["NAVEGADOR","EXTENSIONES","RÁPIDO"]
},
{
name: "Simple Mobile Tools",
icon: "fa-solid fa-mobile-alt",
info: "Suite de aplicaciones simples, limpias y sin anuncios. Incluye calendario, galería, contactos, notas y más.",
enlace: "https://www.simplemobiletools.com/",
modal: null,
badges: ["SUITE","LIGERO","SIN ANUNCIOS"]
}
],
modales: {}
}; // <-- PUNTO Y COMA AQUÍ

// Exportar a window para asegurar acceso global
if (typeof window !== 'undefined') {
  window.FoxWebDB = FoxWebDB;
}