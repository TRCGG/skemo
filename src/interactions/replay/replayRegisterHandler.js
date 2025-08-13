const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const tempReplayStore = require('../../stores/tempReplayStore');

/**
 * @description 상대한 클랜을 선택하는 Select Menu 핸들러
 */

module.exports = async (interaction) => {
  const customId = interaction.customId;
  const messageId = customId.split(':')[1];

  // ✅ 업로더/대기건 검증: 사용자당 1건 설계 전제
  const pending = tempReplayStore.get(interaction.user.id);
  if (!pending || pending.messageId !== messageId) {
    return interaction.reply({
      content: '⚠️ 등록 가능한 리플레이가 없거나, 시간이 초과되었거나, 다른 파일입니다.',
      flags: 64,
    });
  }

  // ✅ 내 클랜 역할 검증: 정확히 1개 필요
  const myClanRoles = interaction.member.roles.cache.filter(r => r.name.startsWith('clan_'));
  if (myClanRoles.size === 0) {
    return interaction.reply({
      content: '❌ 당신에게 할당된 클랜 역할(clan_*)이 없습니다. 관리자에게 문의해주세요.',
      flags: 64,
    });
  }
  const myClanRole = myClanRoles.first();

  // ✅ 상대 클랜 후보 생성 (내 클랜 제외) + 정렬
  const options = interaction.guild.roles.cache
    .filter(role => role.name.startsWith('clan_') && role.id !== myClanRole.id)
    .map(role => ({
      label: role.name.replace(/^clan_/, ''),
      value: role.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko')) // 보기 좋게 정렬
    .slice(0, 25); // Discord 제한: 최대 25개

  if (options.length === 0) {
    return interaction.reply({
      content: '❌ 선택할 수 있는 상대 클랜 역할이 없습니다.',
      flags: 64,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`selectClan:${messageId}`)
    .setPlaceholder(`상대한 클랜을 선택해주세요 (파일: ${pending.name})`)
    .setMinValues(1)
  .setMaxValues(1)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  return interaction.reply({
    content: '📌 상대한 클랜을 선택해주세요.',
    components: [row],
    flags: 64,
  });
};
