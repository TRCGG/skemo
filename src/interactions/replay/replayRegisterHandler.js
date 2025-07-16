const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

/**
 * @description 상대한 클랜을 선택하는 Select Menu 핸들러
 */

module.exports = async (interaction) => {
  const customId = interaction.customId;
  const messageId = customId.split(':')[1];

  const roles = interaction.guild.roles.cache
    .filter(role => role.name.startsWith('clan_'))
    .map(role => ({
      label: role.name,
      value: role.id,
    }));

  if (roles.length === 0) {
    return interaction.reply({
      content: '❌ 선택할 수 있는 클랜 역할이 없습니다.',
      ephemeral: true,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`selectClan:${messageId}`)
    .setPlaceholder('상대한 클랜을 선택해주세요')
    .addOptions(roles.slice(0, 25)); // Discord 제한: 최대 25개

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    content: '📌 상대한 클랜을 선택해주세요.',
    components: [row],
    ephemeral: true,
  });
};
