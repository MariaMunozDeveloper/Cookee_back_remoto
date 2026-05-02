require('dns').setServers(['8.8.8.8', '8.8.4.4']);

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const https = require('https');
const cloudinary = require('../config/cloudinary');

const User = require('../models/user.model');
const Publication = require('../models/publication.model');
const Follow = require('../models/follow.model');
const Comment = require('../models/comment.model');

const UNSPLASH_KEY = 'Ylj0ruAOyniI2M5FWx901YomX8WWQ1haXlb65WNSVWY';
const MARIA_EMAIL = 'maria.munoz@solvam.es';

// ─── 6 NUEVOS USUARIOS ───────────────────────────────────────────────────────
const nuevosUsuarios = [
    { name: 'Sofía', surname: 'Navarro', nick: `sofianavarro_${Date.now()}`, query: 'woman chef smiling kitchen portrait' },
    { name: 'Pablo', surname: 'Ortega', nick: `pabloortega_${Date.now() + 1}`, query: 'man cooking professional chef' },
    { name: 'Lucía', surname: 'Romero', nick: `luciaromero_${Date.now() + 2}`, query: 'woman food blogger cooking home' },
    { name: 'Andrés', surname: 'Jiménez', nick: `andresjimenez_${Date.now() + 3}`, query: 'man bbq grilling outdoor' },
    { name: 'Carmen', surname: 'Torres', nick: `carmentorres_${Date.now() + 4}`, query: 'woman baking pastry kitchen' },
    { name: 'Iván', surname: 'Ruiz', nick: `ivanruiz_${Date.now() + 5}`, query: 'man restaurant chef portrait' },
];

// ─── RECETAS PARA MARÍA (con pasos y fotos de paso) ─────────────────────────
const recetasMaria = [
    {
        title: 'Tarta de limón y merengue',
        description: 'Una tarta clásica y elegante con base de masa quebrada, crema de limón intensamente cítrica y merengue dorado. El equilibrio perfecto entre lo dulce y lo ácido.',
        text: 'Esta tarta lleva años siendo la favorita de mis reuniones familiares. La primera vez que la hice tenía miedo de que el merengue no quedara bien, pero con el truco de añadir el azúcar poco a poco mientras bates sale perfecto. El aroma de la crema de limón cocinándose llena toda la cocina y ya te hace la boca agua. Os aseguro que nadie puede resistirse a repetir.',
        hashtags: ['tarta', 'limon', 'merengue', 'postre', 'reposteria', 'citrico'],
        raciones: 8, tiempoHorno: 15, temperaturaHorno: 200,
        portadaQuery: 'lemon meringue tart elegant slice',
        recommendations: 'La crema de limón debe cocinarse a fuego muy bajo y sin dejar de remover para que no se corte. Usa limones frescos — el zumo de botella no da el mismo resultado. El merengue debe estar a temperatura ambiente para que monte bien.',
        ingredients: [
            { name: 'Harina de repostería', quantity: 250, unit: 'g' },
            { name: 'Mantequilla fría en cubos', quantity: 125, unit: 'g' },
            { name: 'Azúcar glass', quantity: 80, unit: 'g' },
            { name: 'Huevo', quantity: 1, unit: 'unidad' },
            { name: 'Limones (zumo y ralladura)', quantity: 4, unit: 'unidad' },
            { name: 'Azúcar', quantity: 200, unit: 'g' },
            { name: 'Huevos para la crema', quantity: 4, unit: 'unidad' },
            { name: 'Mantequilla para la crema', quantity: 80, unit: 'g' },
            { name: 'Claras de huevo para merengue', quantity: 4, unit: 'unidad' },
            { name: 'Azúcar para merengue', quantity: 200, unit: 'g' },
        ],
        steps: [
            {
                text: 'Mezclar la harina con la mantequilla fría usando las yemas de los dedos hasta obtener una textura arenosa. Añadir el azúcar glass, el huevo y una pizca de sal. Amasar justo hasta que se integre. Envolver en film y refrigerar 30 minutos.',
                query: 'shortcrust pastry dough preparation flour butter'
            },
            {
                text: 'Extender la masa sobre papel de horno y forrar un molde de 24cm. Pinchar el fondo con un tenedor y hornear a ciegas 15 minutos a 180°C con papel y legumbres encima, luego 5 minutos más sin ellas hasta que esté dorada.',
                query: 'tart shell blind baking pastry oven'
            },
            {
                text: 'Para la crema: mezclar en un cazo el zumo de los 4 limones, la ralladura, el azúcar y los huevos. Cocinar a fuego medio-bajo removiendo constantemente durante 10 minutos hasta que espese. Añadir la mantequilla fuera del fuego y remover hasta integrar.',
                query: 'lemon curd cooking saucepan stirring'
            },
            {
                text: 'Verter la crema de limón sobre la base horneada y refrigerar 2 horas mínimo.',
                query: 'lemon curd tart filling pouring'
            },
            {
                text: 'Para el merengue: montar las claras a punto de nieve firme añadiendo el azúcar poco a poco. Cubrir la tarta con el merengue formando picos con una espátula o manga pastelera.',
                query: 'meringue peaks pastry piping decoration'
            },
            {
                text: 'Dorar el merengue con un soplete de cocina o en el horno a 200°C durante 3-4 minutos vigilando que no se queme. Servir frío.',
                query: 'meringue torched golden browned tart'
            },
        ]
    },
    {
        title: 'Paella valenciana auténtica',
        description: 'Paella valenciana tradicional con pollo, conejo, judías verdes y garrofón. Cocinada a fuego de leña con el socarrat perfecto en la base.',
        text: 'La paella valenciana es uno de esos platos que te llevan directo a la infancia. Mi abuela la hacía todos los domingos en el jardín con leña de naranjo y ese aroma es imposible de olvidar. Después de años probando y ajustando cantidades os traigo mi versión más cercana a la suya. El secreto está en el sofrito bien hecho, el caldo caliente y la proporción exacta de arroz y agua. Y por supuesto, el socarrat.',
        hashtags: ['paella', 'valenciana', 'arroz', 'tradicional', 'espanola', 'domingo'],
        raciones: 6, tiempoHorno: null, temperaturaHorno: null,
        portadaQuery: 'authentic valencian paella rice chicken rabbit',
        recommendations: 'La paella nunca se remueve una vez añadido el arroz. El fuego debe ir bajando progresivamente. Para el socarrat, sube el fuego al máximo los últimos 2 minutos y retira cuando escuches un ligero chisporroteo. Tapa con papel de periódico y deja reposar 5 minutos antes de servir.',
        ingredients: [
            { name: 'Arroz de grano corto (tipo bomba)', quantity: 400, unit: 'g' },
            { name: 'Pollo troceado', quantity: 600, unit: 'g' },
            { name: 'Conejo troceado', quantity: 400, unit: 'g' },
            { name: 'Judías verdes planas', quantity: 200, unit: 'g' },
            { name: 'Garrofón (judía blanca grande)', quantity: 150, unit: 'g' },
            { name: 'Tomate maduro rallado', quantity: 3, unit: 'unidad' },
            { name: 'Pimentón dulce', quantity: 1, unit: 'cucharadita' },
            { name: 'Azafrán', quantity: 1, unit: 'pizca' },
            { name: 'Aceite de oliva virgen extra', quantity: 80, unit: 'ml' },
            { name: 'Caldo de pollo casero', quantity: 1.2, unit: 'l' },
            { name: 'Sal', quantity: 1, unit: 'cucharada' },
            { name: 'Romero fresco', quantity: 2, unit: 'cucharada' },
        ],
        steps: [
            {
                text: 'Calentar el aceite en la paellera a fuego fuerte. Salar el pollo y el conejo y dorar bien por todos los lados hasta que estén bien tostados, unos 15 minutos. La carne bien dorada es fundamental para el sabor.',
                query: 'chicken rabbit browning paella pan golden'
            },
            {
                text: 'Apartar la carne hacia los bordes y sofreír las judías verdes y el garrofón en el centro durante 5 minutos. Añadir el tomate rallado y cocinar 8 minutos hasta que pierda el agua y quede un sofrito oscuro y concentrado.',
                query: 'paella sofrito tomato vegetables cooking'
            },
            {
                text: 'Añadir el pimentón dulce, remover rápido 30 segundos para que no se queme, e incorporar el caldo caliente con el azafrán disuelto. Rectificar de sal — el caldo debe estar bastante sabroso.',
                query: 'paella broth saffron adding stock'
            },
            {
                text: 'Cuando el caldo hierva, añadir el arroz distribuyéndolo en forma de cruz o de manera uniforme por toda la paellera. A partir de este momento no se remueve más.',
                query: 'paella rice adding spreading evenly'
            },
            {
                text: 'Cocinar a fuego fuerte 8 minutos, luego bajar a fuego medio 8 minutos más. Añadir el romero y dejar los últimos 2 minutos a fuego máximo para conseguir el socarrat.',
                query: 'paella cooking simmering socarrat bottom'
            },
            {
                text: 'Retirar del fuego, cubrir con papel de periódico o un paño limpio y dejar reposar 5 minutos. Servir directamente en la paellera.',
                query: 'paella valenciana finished served traditional'
            },
        ]
    }
];

// ─── RECETAS PARA NUEVOS USUARIOS ────────────────────────────────────────────
const recetasNuevosUsuarios = [
    {
        title: 'Cheesecake de frutos rojos',
        description: 'Cheesecake cremoso sin horno con base de galleta y cobertura de frutos rojos frescos. Fácil, rápido y espectacular.',
        text: 'Este cheesecake es mi salvavidas para las cenas improvisadas. Sin horno, sin complicaciones y queda tan bonito que parece de pastelería. La clave está en usar queso crema a temperatura ambiente y en dejarlo reposar toda la noche en la nevera.',
        hashtags: ['cheesecake', 'frutos_rojos', 'postre', 'sin_horno', 'reposteria'],
        raciones: 8, tiempoHorno: null, temperaturaHorno: null,
        portadaQuery: 'cheesecake red berries elegant slice',
        ingredients: [
            { name: 'Galletas digestive', quantity: 250, unit: 'g' },
            { name: 'Mantequilla derretida', quantity: 100, unit: 'g' },
            { name: 'Queso crema', quantity: 500, unit: 'g' },
            { name: 'Nata para montar', quantity: 250, unit: 'ml' },
            { name: 'Azúcar glass', quantity: 120, unit: 'g' },
            { name: 'Gelatina en polvo', quantity: 10, unit: 'g' },
            { name: 'Frutos rojos variados', quantity: 300, unit: 'g' },
        ],
        steps: [
            { text: 'Triturar las galletas y mezclar con la mantequilla derretida. Presionar en la base del molde y refrigerar 20 minutos.' },
            { text: 'Disolver la gelatina en 3 cucharadas de agua caliente. Batir el queso crema con el azúcar hasta obtener una crema lisa.' },
            { text: 'Montar la nata e incorporar al queso con movimientos envolventes. Añadir la gelatina y mezclar.' },
            { text: 'Verter sobre la base de galleta y refrigerar mínimo 6 horas o toda la noche.' },
            { text: 'Decorar con los frutos rojos frescos antes de servir.' },
        ],
        recommendations: 'El queso crema debe estar a temperatura ambiente para que no queden grumos. Se puede sustituir la gelatina por agar-agar para una versión vegetariana.'
    },
    {
        title: 'Croquetas de jamón ibérico',
        description: 'Croquetas caseras cremosas por dentro y crujientes por fuera, con jamón ibérico de calidad. La receta definitiva.',
        text: 'Las croquetas son el plato que más me gusta hacer un domingo con tiempo. Hay que tener paciencia con la bechamel pero el resultado es incomparable con cualquier croqueta industrial. Con jamón ibérico de verdad son otro nivel.',
        hashtags: ['croquetas', 'jamon', 'tapas', 'espanol', 'tradicional'],
        raciones: 30, tiempoHorno: null, temperaturaHorno: null,
        portadaQuery: 'croquettes spanish ham crispy golden',
        ingredients: [
            { name: 'Jamón ibérico picado', quantity: 200, unit: 'g' },
            { name: 'Mantequilla', quantity: 80, unit: 'g' },
            { name: 'Harina', quantity: 120, unit: 'g' },
            { name: 'Leche entera caliente', quantity: 800, unit: 'ml' },
            { name: 'Cebolla', quantity: 0.5, unit: 'unidad' },
            { name: 'Nuez moscada', quantity: 1, unit: 'pizca' },
            { name: 'Huevos para empanar', quantity: 3, unit: 'unidad' },
            { name: 'Pan rallado', quantity: 200, unit: 'g' },
        ],
        steps: [
            { text: 'Sofreír la cebolla picada muy fina en la mantequilla hasta que esté transparente. Añadir el jamón y cocinar 2 minutos.' },
            { text: 'Añadir la harina y tostar 3 minutos removiendo constantemente.' },
            { text: 'Incorporar la leche caliente poco a poco sin dejar de remover. Cocinar 15 minutos a fuego medio hasta obtener una bechamel muy espesa.' },
            { text: 'Extender en una bandeja, cubrir con film a piel y refrigerar mínimo 4 horas.' },
            { text: 'Formar las croquetas, pasar por huevo batido y pan rallado, y freír en aceite abundante a 180°C.' },
        ],
        recommendations: 'La bechamel debe quedar muy espesa — si se despega sola del fondo es señal de que está lista. Cuanto más fría esté, más fácil es darles forma.'
    }
];

// ─── COMENTARIOS ─────────────────────────────────────────────────────────────
const comentarios = [
    'Acabo de hacer esta receta y ha quedado increíble. Toda la familia ha repetido y eso que mi hijo es muy difícil para comer. Definitivamente se queda en mi recetario.',
    'Llevaba meses buscando una receta así de bien explicada. Me salió a la primera siguiendo tus pasos al pie de la letra. Muchas gracias por compartirla.',
    'La hice el domingo para una comida familiar y fue el plato estrella de la tarde. Mi madre, que es muy exigente con la cocina, me pidió la receta.',
    'Perfecta para el fin de semana cuando tienes tiempo de cocinar con calma. Le añadí un poco más de especias porque nos gusta con sabor y quedó espectacular.',
    'Nunca había conseguido que me quedara bien y con tu receta lo he logrado a la primera. El truco que explicas en las recomendaciones es clave.',
    'Esta receta se ha convertido en mi favorita del mes. La he hecho tres veces ya y cada vez me sale mejor. Los comentarios de los invitados no tienen precio.',
    'Sencilla, rápida y deliciosa. Justo lo que buscaba para una cena entre semana sin complicarme demasiado. El resultado parece de restaurante.',
    'Me encanta cómo explicas cada paso con tanto detalle. Se nota que llevas tiempo haciendo esta receta y que la conoces muy bien.',
    'Espectacular. No tengo más palabras. La hice para el cumpleaños de mi pareja y fue el mejor regalo gastronómico. Repetiremos en Navidad.',
    'Primera vez que comento en Cookee pero tenía que hacerlo. Esta receta es de 10. Fácil, sabrosa y con ingredientes que tienes en casa. Más así por favor.',
    'La hice para llevar a una cena con amigos y se acabó antes que el resto de platos. Todo el mundo preguntando la receta. Ya les he mandado el enlace.',
    'Qué buenas fotos y qué bien explicado todo. Se nota el cariño que le pones a cada publicación. Seguiré todas tus recetas de cerca.',
    'Llevaba tiempo queriendo intentarlo y al ver tu receta me animé. Resultado: sobresaliente. La textura y el sabor son exactamente como en la foto.',
    'Hice el doble de cantidad porque éramos muchos y aun así no sobró nada. La próxima vez haré el triple. Un éxito rotundo.',
    'Me ha encantado encontrar una receta tan completa con fotos de cada paso. Se agradece muchísimo cuando estás aprendiendo a cocinar.',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function subirImagen(query, carpeta) {
    return new Promise((resolve) => {
        const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_KEY}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);
                    const imageUrl = json.urls?.regular;
                    if (!imageUrl) { resolve(null); return; }

                    const imageBuffer = await new Promise((res2, rej) => {
                        https.get(imageUrl, (imgRes) => {
                            const chunks = [];
                            imgRes.on('data', chunk => chunks.push(chunk));
                            imgRes.on('end', () => res2(Buffer.concat(chunks)));
                            imgRes.on('error', rej);
                        }).on('error', rej);
                    });

                    const resultado = await new Promise((res2, rej) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { folder: `cookee/${carpeta}` },
                            (error, result) => { if (error) rej(error); else res2(result); }
                        );
                        stream.end(imageBuffer);
                    });

                    resolve(resultado.secure_url);
                } catch (e) {
                    console.log('  ⚠ Error imagen:', e.message);
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function crearPublicacion(userId, receta, conFotosDeStep = false) {
    console.log(`  → Descargando portada para "${receta.title}"...`);
    await sleep(1200);
    const portada = await subirImagen(receta.portadaQuery, 'publications');

    const steps = [];
    for (let i = 0; i < receta.steps.length; i++) {
        const step = receta.steps[i];
        let stepImg = null;
        if (conFotosDeStep && step.query) {
            console.log(`  → Descargando foto paso ${i + 1}...`);
            await sleep(1200);
            stepImg = await subirImagen(step.query, 'publications');
        }
        steps.push({ text: step.text, image: stepImg });
    }

    const pub = new Publication({
        user: userId,
        title: receta.title,
        description: receta.description,
        text: receta.text,
        hashtags: receta.hashtags,
        raciones: receta.raciones,
        tiempoHorno: receta.tiempoHorno,
        temperaturaHorno: receta.temperaturaHorno,
        ingredients: receta.ingredients,
        steps,
        recommendations: receta.recommendations || '',
        images: portada ? [portada] : [],
        likes: [],
        views: rand(80, 500)
    });

    await pub.save();
    return pub;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function seedHoy() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado\n');

        const todosUsuarios = await User.find({});
        const todasPublicaciones = await Publication.find({});
        const maria = await User.findOne({ email: MARIA_EMAIL });

        if (!maria) { console.log(`⚠ No se encontró ${MARIA_EMAIL}`); process.exit(1); }
        console.log(`✓ María encontrada: @${maria.nick}\n`);

        const password = await bcrypt.hash('password123', 10);
        const usuariosCreados = [];

        // 1. CREAR 6 NUEVOS USUARIOS
        console.log('═══════════════════════════════════════');
        console.log('1. CREANDO 6 NUEVOS USUARIOS');
        console.log('═══════════════════════════════════════');
        for (const u of nuevosUsuarios) {
            await sleep(1200);
            const avatarUrl = await subirImagen(u.query, 'avatars');
            const usuario = new User({
                name: u.name, surname: u.surname, nick: u.nick,
                email: `${u.nick}@cookee.com`, password,
                image: avatarUrl || null, role: 'ROLE_USER'
            });
            await usuario.save();
            usuariosCreados.push(usuario);
            console.log(`  ✓ @${u.nick} creado`);
        }

        const todosLosUsuarios = [...todosUsuarios, ...usuariosCreados];

        // 2. FOLLOWS — todos los nuevos siguen a María + algunos existentes también
        console.log('\n═══════════════════════════════════════');
        console.log('2. FOLLOWS HACIA MARÍA');
        console.log('═══════════════════════════════════════');
        for (const u of usuariosCreados) {
            const ya = await Follow.findOne({ user: u._id, followed: maria._id });
            if (!ya) {
                await new Follow({ user: u._id, followed: maria._id }).save();
                console.log(`  ✓ @${u.nick} sigue a @${maria.nick}`);
            }
        }
        // algunos usuarios existentes también siguen a María hoy
        const sinSeguir = [];
        for (const u of todosUsuarios) {
            if (u._id.toString() === maria._id.toString()) continue;
            const ya = await Follow.findOne({ user: u._id, followed: maria._id });
            if (!ya) sinSeguir.push(u);
        }
        const aSeguir = sinSeguir.sort(() => Math.random() - 0.5).slice(0, rand(3, 6));
        for (const u of aSeguir) {
            await new Follow({ user: u._id, followed: maria._id }).save();
            console.log(`  ✓ @${u.nick} sigue a @${maria.nick}`);
        }

        // nuevos usuarios también siguen a otros
        for (const u of usuariosCreados) {
            const aQuien = todosUsuarios.sort(() => Math.random() - 0.5).slice(0, rand(4, 8));
            for (const seguido of aQuien) {
                const ya = await Follow.findOne({ user: u._id, followed: seguido._id });
                if (!ya) await new Follow({ user: u._id, followed: seguido._id }).save();
            }
        }
        console.log('  ✓ Nuevos usuarios siguen a usuarios existentes');

        // 3. RECETAS PARA MARÍA (con fotos de pasos)
        console.log('\n═══════════════════════════════════════');
        console.log('3. PUBLICANDO 2 RECETAS PARA MARÍA');
        console.log('═══════════════════════════════════════');
        const pubsMaria = [];
        for (const receta of recetasMaria) {
            console.log(`\n  Receta: "${receta.title}"`);
            const pub = await crearPublicacion(maria._id, receta, true); // con fotos de paso
            pubsMaria.push(pub);
            console.log(`  ✓ "${receta.title}" publicada con fotos de pasos`);
        }

        // 4. RECETAS PARA ALGUNOS NUEVOS USUARIOS
        console.log('\n═══════════════════════════════════════');
        console.log('4. PUBLICANDO RECETAS DE NUEVOS USUARIOS');
        console.log('═══════════════════════════════════════');
        const pubsNuevas = [];
        const autoresRecetas = usuariosCreados.slice(0, 2); // Sofía y Pablo publican
        for (let i = 0; i < recetasNuevosUsuarios.length; i++) {
            const receta = recetasNuevosUsuarios[i];
            const autor = autoresRecetas[i % autoresRecetas.length];
            console.log(`\n  Receta: "${receta.title}" por @${autor.nick}`);
            const pub = await crearPublicacion(autor._id, receta, false);
            pubsNuevas.push(pub);
            console.log(`  ✓ "${receta.title}" publicada`);
        }

        // 5. LIKES A LAS RECETAS DE MARÍA
        console.log('\n═══════════════════════════════════════');
        console.log('5. LIKES A RECETAS DE MARÍA');
        console.log('═══════════════════════════════════════');
        const todasPubsMaria = await Publication.find({ user: maria._id });
        for (const pub of todasPubsMaria) {
            const candidatos = todosLosUsuarios.filter(u =>
                !pub.likes.some(l => l.toString() === u._id.toString())
            );
            const likers = candidatos.sort(() => Math.random() - 0.5).slice(0, rand(3, 8));
            if (likers.length > 0) {
                pub.likes = [...pub.likes, ...likers.map(u => u._id)];
                await pub.save();
                console.log(`  ✓ +${likers.length} likes en "${pub.title}"`);
            }
        }

        // likes a nuevas recetas
        for (const pub of [...pubsNuevas]) {
            const likers = todosLosUsuarios.sort(() => Math.random() - 0.5).slice(0, rand(4, 12));
            pub.likes = likers.map(u => u._id);
            await pub.save();
            console.log(`  ✓ ${likers.length} likes en "${pub.title}"`);
        }

        // likes extra a publicaciones existentes aleatorias
        const pubsAleatorias = todasPublicaciones.sort(() => Math.random() - 0.5).slice(0, rand(5, 8));
        for (const pub of pubsAleatorias) {
            const candidatos = todosLosUsuarios.filter(u =>
                !pub.likes.some(l => l.toString() === u._id.toString())
            );
            const likers = candidatos.sort(() => Math.random() - 0.5).slice(0, rand(1, 4));
            if (likers.length > 0) {
                pub.likes = [...pub.likes, ...likers.map(u => u._id)];
                await pub.save();
                console.log(`  ✓ +${likers.length} likes en "${pub.title}"`);
            }
        }

        // 6. COMENTARIOS
        console.log('\n═══════════════════════════════════════');
        console.log('6. AÑADIENDO COMENTARIOS');
        console.log('═══════════════════════════════════════');
        const todasLasPubs = [...todasPubsMaria, ...pubsNuevas, ...pubsAleatorias];
        let comentariosCreados = 0;
        const numComentarios = rand(15, 25);

        while (comentariosCreados < numComentarios) {
            const pub = pick(todasLasPubs);
            const autor = pick(todosLosUsuarios);
            await new Comment({
                text: pick(comentarios),
                user: autor._id,
                publication: pub._id
            }).save();
            comentariosCreados++;
        }
        console.log(`  ✓ ${comentariosCreados} comentarios añadidos`);

        console.log('\n═══════════════════════════════════════');
        console.log('✅ SCRIPT COMPLETADO');
        console.log('═══════════════════════════════════════');
        console.log(`   Nuevos usuarios: ${usuariosCreados.length}`);
        console.log(`   Recetas de María con fotos de pasos: ${pubsMaria.length}`);
        console.log(`   Recetas de nuevos usuarios: ${pubsNuevas.length}`);
        console.log(`   Comentarios añadidos: ${comentariosCreados}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedHoy();