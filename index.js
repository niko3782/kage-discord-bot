import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !guildId) {
  throw new Error("Faltan DISCORD_TOKEN o GUILD_ID en las variables de entorno.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Crea la estructura competitiva de Kage.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function registerCommand() {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, guildId),
    { body: [command.toJSON()] }
  );
}

const roleSpecs = [
  ["OWNER", 0x111111],
  ["DIRECTOR", 0x6f42c1],
  ["ADMIN", 0xc0392b],
  ["MODERATOR", 0x2980b9],
  ["HELPER", 0x27ae60],
  ["TOURNAMENT STAFF", 0xf39c12],
  ["COMPETITIVE", 0xe74c3c],
  ["BOOSTER", 0x9b59b6],
  ["PLAYER", 0x3498db],
  ["MEMBER", 0x95a5a6]
];

const structure = [
  {
    name: "⛩️・ENTRADA",
    channels: [
      ["👋・bienvenida", "text"],
      ["📜・reglas", "text"],
      ["✅・verificacion", "text"],
      ["📢・anuncios", "text"],
      ["🎭・roles", "text"]
    ]
  },
  {
    name: "⚔️・COMPETITIVE",
    channels: [
      ["💬・chat-competitive", "text"],
      ["🎯・buscando-team", "text"],
      ["🏆・torneos", "text"],
      ["📊・rankings", "text"],
      ["📋・resultados", "text"],
      ["🔥・clips", "text"]
    ]
  },
  {
    name: "🎮・COMMUNITY",
    channels: [
      ["💭・general", "text"],
      ["😂・memes", "text"],
      ["📸・media", "text"],
      ["🎵・musica", "text"]
    ]
  },
  {
    name: "🎧・VOICE",
    channels: [
      ["🔊・Lobby", "voice"],
      ["⚔️・Competitive I", "voice"],
      ["⚔️・Competitive II", "voice"],
      ["🏆・Tournament", "voice"],
      ["💤・AFK", "voice"]
    ]
  },
  {
    name: "🛠️・SUPPORT",
    channels: [
      ["🎫・tickets", "text"],
      ["❓・soporte", "text"],
      ["🚨・reportes", "text"]
    ]
  },
  {
    name: "🔒・STAFF",
    staffOnly: true,
    channels: [
      ["💼・staff-chat", "text"],
      ["📋・logs", "text"],
      ["⚖️・sanciones", "text"],
      ["🚨・staff-reports", "text"]
    ]
  }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ensureRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);
  if (!role) role = await guild.roles.create({ name, color, reason: "Kage setup" });
  return role;
}

async function ensureCategory(guild, name, staffOnly, staffRole) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole) {
    await category.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await category.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true
    });
  }

  return category;
}

async function ensureChannel(guild, category, name, kind, staffOnly, staffRole) {
  let channel = guild.channels.cache.find(
    c => c.parentId === category.id && c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
      parent: category.id,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole && channel.type === ChannelType.GuildText) {
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await channel.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
  }

  return channel;
}

async function setupGuild(guild) {
  const roles = {};
  for (const [name, color] of roleSpecs) {
    roles[name] = await ensureRole(guild, name, color);
    await sleep(150);
  }

  const staffRole = roles["ADMIN"];

  for (const section of structure) {
    const category = await ensureCategory(guild, section.name, section.staffOnly, staffRole);

    for (const [name, kind] of section.channels) {
      await ensureChannel(
        guild,
        category,
        name,
        kind,
        section.staffOnly,
        staffRole
      );
      await sleep(150);
    }
  }

  return roles;
}

client.once("ready", async () => {
  console.log(`Conectado como ${client.user.tag}`);
  await registerCommand();
  console.log("Comando /setup registrado.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "setup") return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Necesitas Administrador para usar este comando.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    await guild.channels.fetch();

    await setupGuild(guild);

    await interaction.editReply(
      "✅ **Kage configurado.** Se crearon las categorías, canales y roles que faltaban. No se borraron canales existentes."
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "❌ No pude completar la configuración. Revisa la consola y que el bot tenga permisos suficientes."
    );
  }
});

client.login(token);import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !guildId) {
  throw new Error("Faltan DISCORD_TOKEN o GUILD_ID en las variables de entorno.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Crea la estructura competitiva de Kage.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function registerCommand() {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, guildId),
    { body: [command.toJSON()] }
  );
}

const roleSpecs = [
  ["OWNER", 0x111111],
  ["DIRECTOR", 0x6f42c1],
  ["ADMIN", 0xc0392b],
  ["MODERATOR", 0x2980b9],
  ["HELPER", 0x27ae60],
  ["TOURNAMENT STAFF", 0xf39c12],
  ["COMPETITIVE", 0xe74c3c],
  ["BOOSTER", 0x9b59b6],
  ["PLAYER", 0x3498db],
  ["MEMBER", 0x95a5a6]
];

const structure = [
  {
    name: "⛩️・ENTRADA",
    channels: [
      ["👋・bienvenida", "text"],
      ["📜・reglas", "text"],
      ["✅・verificacion", "text"],
      ["📢・anuncios", "text"],
      ["🎭・roles", "text"]
    ]
  },
  {
    name: "⚔️・COMPETITIVE",
    channels: [
      ["💬・chat-competitive", "text"],
      ["🎯・buscando-team", "text"],
      ["🏆・torneos", "text"],
      ["📊・rankings", "text"],
      ["📋・resultados", "text"],
      ["🔥・clips", "text"]
    ]
  },
  {
    name: "🎮・COMMUNITY",
    channels: [
      ["💭・general", "text"],
      ["😂・memes", "text"],
      ["📸・media", "text"],
      ["🎵・musica", "text"]
    ]
  },
  {
    name: "🎧・VOICE",
    channels: [
      ["🔊・Lobby", "voice"],
      ["⚔️・Competitive I", "voice"],
      ["⚔️・Competitive II", "voice"],
      ["🏆・Tournament", "voice"],
      ["💤・AFK", "voice"]
    ]
  },
  {
    name: "🛠️・SUPPORT",
    channels: [
      ["🎫・tickets", "text"],
      ["❓・soporte", "text"],
      ["🚨・reportes", "text"]
    ]
  },
  {
    name: "🔒・STAFF",
    staffOnly: true,
    channels: [
      ["💼・staff-chat", "text"],
      ["📋・logs", "text"],
      ["⚖️・sanciones", "text"],
      ["🚨・staff-reports", "text"]
    ]
  }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ensureRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);
  if (!role) role = await guild.roles.create({ name, color, reason: "Kage setup" });
  return role;
}

async function ensureCategory(guild, name, staffOnly, staffRole) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole) {
    await category.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await category.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true
    });
  }

  return category;
}

async function ensureChannel(guild, category, name, kind, staffOnly, staffRole) {
  let channel = guild.channels.cache.find(
    c => c.parentId === category.id && c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
      parent: category.id,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole && channel.type === ChannelType.GuildText) {
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await channel.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
  }

  return channel;
}

async function setupGuild(guild) {
  const roles = {};
  for (const [name, color] of roleSpecs) {
    roles[name] = await ensureRole(guild, name, color);
    await sleep(150);
  }

  const staffRole = roles["ADMIN"];

  for (const section of structure) {
    const category = await ensureCategory(guild, section.name, section.staffOnly, staffRole);

    for (const [name, kind] of section.channels) {
      await ensureChannel(
        guild,
        category,
        name,
        kind,
        section.staffOnly,
        staffRole
      );
      await sleep(150);
    }
  }

  return roles;
}

client.once("ready", async () => {
  console.log(`Conectado como ${client.user.tag}`);
  await registerCommand();
  console.log("Comando /setup registrado.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "setup") return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Necesitas Administrador para usar este comando.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    await guild.channels.fetch();

    await setupGuild(guild);

    await interaction.editReply(
      "✅ **Kage configurado.** Se crearon las categorías, canales y roles que faltaban. No se borraron canales existentes."
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "❌ No pude completar la configuración. Revisa la consola y que el bot tenga permisos suficientes."
    );
  }
});

client.login(token);import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType
} from "discord.js";

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;

if (!token || !guildId) {
  throw new Error("Faltan DISCORD_TOKEN o GUILD_ID en las variables de entorno.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Crea la estructura competitiva de Kage.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function registerCommand() {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, guildId),
    { body: [command.toJSON()] }
  );
}

const roleSpecs = [
  ["OWNER", 0x111111],
  ["DIRECTOR", 0x6f42c1],
  ["ADMIN", 0xc0392b],
  ["MODERATOR", 0x2980b9],
  ["HELPER", 0x27ae60],
  ["TOURNAMENT STAFF", 0xf39c12],
  ["COMPETITIVE", 0xe74c3c],
  ["BOOSTER", 0x9b59b6],
  ["PLAYER", 0x3498db],
  ["MEMBER", 0x95a5a6]
];

const structure = [
  {
    name: "⛩️・ENTRADA",
    channels: [
      ["👋・bienvenida", "text"],
      ["📜・reglas", "text"],
      ["✅・verificacion", "text"],
      ["📢・anuncios", "text"],
      ["🎭・roles", "text"]
    ]
  },
  {
    name: "⚔️・COMPETITIVE",
    channels: [
      ["💬・chat-competitive", "text"],
      ["🎯・buscando-team", "text"],
      ["🏆・torneos", "text"],
      ["📊・rankings", "text"],
      ["📋・resultados", "text"],
      ["🔥・clips", "text"]
    ]
  },
  {
    name: "🎮・COMMUNITY",
    channels: [
      ["💭・general", "text"],
      ["😂・memes", "text"],
      ["📸・media", "text"],
      ["🎵・musica", "text"]
    ]
  },
  {
    name: "🎧・VOICE",
    channels: [
      ["🔊・Lobby", "voice"],
      ["⚔️・Competitive I", "voice"],
      ["⚔️・Competitive II", "voice"],
      ["🏆・Tournament", "voice"],
      ["💤・AFK", "voice"]
    ]
  },
  {
    name: "🛠️・SUPPORT",
    channels: [
      ["🎫・tickets", "text"],
      ["❓・soporte", "text"],
      ["🚨・reportes", "text"]
    ]
  },
  {
    name: "🔒・STAFF",
    staffOnly: true,
    channels: [
      ["💼・staff-chat", "text"],
      ["📋・logs", "text"],
      ["⚖️・sanciones", "text"],
      ["🚨・staff-reports", "text"]
    ]
  }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ensureRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);
  if (!role) role = await guild.roles.create({ name, color, reason: "Kage setup" });
  return role;
}

async function ensureCategory(guild, name, staffOnly, staffRole) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole) {
    await category.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await category.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true
    });
  }

  return category;
}

async function ensureChannel(guild, category, name, kind, staffOnly, staffRole) {
  let channel = guild.channels.cache.find(
    c => c.parentId === category.id && c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText,
      parent: category.id,
      reason: "Kage setup"
    });
  }

  if (staffOnly && staffRole && channel.type === ChannelType.GuildText) {
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      ViewChannel: false
    });
    await channel.permissionOverwrites.edit(staffRole, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
  }

  return channel;
}

async function setupGuild(guild) {
  const roles = {};
  for (const [name, color] of roleSpecs) {
    roles[name] = await ensureRole(guild, name, color);
    await sleep(150);
  }

  const staffRole = roles["ADMIN"];

  for (const section of structure) {
    const category = await ensureCategory(guild, section.name, section.staffOnly, staffRole);

    for (const [name, kind] of section.channels) {
      await ensureChannel(
        guild,
        category,
        name,
        kind,
        section.staffOnly,
        staffRole
      );
      await sleep(150);
    }
  }

  return roles;
}

client.once("ready", async () => {
  console.log(`Conectado como ${client.user.tag}`);
  await registerCommand();
  console.log("Comando /setup registrado.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "setup") return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Necesitas Administrador para usar este comando.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.roles.fetch();
    await guild.channels.fetch();

    await setupGuild(guild);

    await interaction.editReply(
      "✅ **Kage configurado.** Se crearon las categorías, canales y roles que faltaban. No se borraron canales existentes."
    );
  } catch (error) {
    console.error(error);
    await interaction.editReply(
      "❌ No pude completar la configuración. Revisa la consola y que el bot tenga permisos suficientes."
    );
  }
});

client.login(token);
