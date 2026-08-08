import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !guildId) {
  throw new Error("Faltan DISCORD_TOKEN o GUILD_ID en Render.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ==========================
// COMANDO /TICKET
// ==========================

const ticketCommand = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Crea un ticket privado de soporte.");

// ==========================
// REGISTRAR COMANDO
// ==========================

async function registerCommand() {
  const rest = new REST({ version: "10" }).setToken(token);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, guildId),
    {
      body: [ticketCommand.toJSON()]
    }
  );

  console.log("Comando /ticket registrado.");
}

// ==========================
// BOT CONECTADO
// ==========================

client.once("ready", async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);

  await registerCommand();

  console.log("🤖 Bot listo.");
});

// ==========================
// 👋 BIENVENIDAS
// ==========================

client.on("guildMemberAdd", async member => {
  try {
    // Busca el canal por nombre
    const channel = member.guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.name === "👋・bienvenida"
    );

    if (!channel) {
      console.log("⚠️ No existe el canal 👋・bienvenida.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x6f42c1)
      .setTitle("⛩️ ¡Bienvenido a Kage!")
      .setDescription(
        `👋 ¡Bienvenido/a ${member}!\n\n` +
        `⚔️ Esperamos que disfrutes de Kage.\n` +
        `📜 No olvides leer las reglas.\n\n` +
        `👥 Ahora somos **${member.guild.memberCount}** miembros.`
      )
      .setThumbnail(
        member.user.displayAvatarURL({ size: 256 })
      )
      .setFooter({
        text: "Kage • Community"
      })
      .setTimestamp();

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });

    console.log(`👋 Bienvenida enviada a ${member.user.tag}`);
  } catch (error) {
    console.error("❌ Error en bienvenida:", error);
  }
});

// ==========================
// 🚪 DESPEDIDAS
// ==========================

client.on("guildMemberRemove", async member => {
  try {
    const channel = member.guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.name === "🚪・despedida"
    );

    if (!channel) {
      console.log("⚠️ No existe el canal 🚪・despedida.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle("🚪 Un miembro se ha ido")
      .setDescription(
        `😢 **${member.user.username}** ha abandonado Kage.\n\n` +
        `👋 ¡Esperamos volver a verte!`
      )
      .setThumbnail(
        member.user.displayAvatarURL({ size: 256 })
      )
      .setFooter({
        text: "Kage • Community"
      })
      .setTimestamp();

    await channel.send({
      embeds: [embed]
    });

    console.log(`🚪 Despedida enviada para ${member.user.tag}`);
  } catch (error) {
    console.error("❌ Error en despedida:", error);
  }
});

// ==========================
// 🎫 TICKETS
// ==========================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "ticket") return;

  try {
    const guild = interaction.guild;
    const member = interaction.member;

    // Comprobar si ya tiene ticket
    const existingTicket = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.name === `ticket-${member.user.id}`
    );

    if (existingTicket) {
      return interaction.reply({
        content: `🎫 Ya tienes un ticket abierto: ${existingTicket}`,
        flags: 64
      });
    }

    // Buscar categoría SUPPORT
    let category = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === "🛠️・SUPPORT"
    );

    // Si no existe, crearla
    if (!category) {
      category = await guild.channels.create({
        name: "🛠️・SUPPORT",
        type: ChannelType.GuildCategory
      });
    }

    // Buscar rol de Staff
    const staffRole = guild.roles.cache.find(
      role =>
        role.name === "ADMIN" ||
        role.name === "MODERATOR"
    );

    // Crear permisos
    const permissions = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];

    if (staffRole) {
      permissions.push({
        id: staffRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }

    // Crear canal
    const ticket = await guild.channels.create({
      name: `ticket-${member.user.id}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
      reason: `Ticket creado por ${member.user.tag}`
    });

    // Embed del ticket
    const embed = new EmbedBuilder()
      .setColor(0x6f42c1)
      .setTitle("🎫 Ticket de soporte")
      .setDescription(
        `Hola ${member} 👋\n\n` +
        `Explica aquí tu problema o consulta.\n` +
        `Un miembro del Staff te atenderá lo antes posible.\n\n` +
        `🔒 Este canal es privado.`
      )
      .setFooter({
        text: "Kage Support"
      })
      .setTimestamp();

    await ticket.send({
      content: staffRole
        ? `${member} <@&${staffRole.id}>`
        : `${member}`,
      embeds: [embed]
    });

    await interaction.reply({
      content: `✅ Tu ticket ha sido creado: ${ticket}`,
      flags: 64
    });

    console.log(
      `🎫 Ticket creado por ${member.user.tag}`
    );
  } catch (error) {
    console.error("❌ Error creando ticket:", error);

    if (!interaction.replied) {
      await interaction.reply({
        content:
          "❌ No pude crear el ticket. Comprueba que el bot tenga permisos suficientes.",
        flags: 64
      });
    }
  }
});

// ==========================
// LOGIN
// ==========================

client.login(token);
