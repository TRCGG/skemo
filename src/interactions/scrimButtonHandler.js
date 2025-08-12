// src/interactions/scrimButtonHandler.js
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { buildScrimEmbed, createButtons, updateEmbedDesc } = require('../utils/scrimButtonEmbed');
const { getFormatTimestamp } = require('../utils/stringUtils');
const scrimStore = require('../stores/scrimStore');
const Scrim = require('../model/scrim');
const {removeOpenRoleIfNoOpen} = require('../utils/roleUtils');

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  // customId: `${action}:${ownerId}`
  const [action, ownerId] = String(interaction.customId).split(':');  // 스크림 작성자 ID
  const messageId = interaction.message.id;  //작성자 스크림 메시지 ID

  const ownerScrim = scrimStore.get(messageId);  // 작성자 스크림 정보
  const embed = interaction.message.embeds?.[0];
  const applicantUserId = interaction.user.id; // 버튼을 누른 사용자 ID

  if (!embed || !ownerScrim) {
    return interaction.reply({ content: '❌ 유효하지 않은 모집글입니다.', flags: 64 });
  }

  // 작성자 전용 액션 보호
  const isOwnerAction = action === 'setOpen' || action === 'setClose' || action === 'scrimCancelConfirm';
  if (isOwnerAction && applicantUserId !== ownerId) {
    return interaction.reply({ content: '❌ 이 버튼은 모집글 작성자만 사용할 수 있습니다.', flags: 64 });
  }

  try {
    switch (action) {
      // ✅ 모집 시작
      case 'setOpen': {
        const res = scrimStore.updateStatus(messageId, Scrim.Status.OPEN);
        if (!res.ok) return interaction.reply({ content: res.error || '상태 변경 실패', flags: 64 });

        // 역할 부여(선택)
        const role = interaction.guild.roles.cache.find((r) => r.name === '스크림모집중');
        if (role) {
          const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
          if (member && !member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(() => null);
          }
        }

        // 임베드/버튼 갱신 (간단히 상태 텍스트만 교체)
        const timeStr = getFormatTimestamp();
        const newStatusText = `${Scrim.Status.OPEN}(${timeStr})`;
        const updatedEmbed = updateEmbedDesc(embed, newStatusText);
        const buttons = createButtons(ownerId, true);

        await interaction.update({ embeds: [updatedEmbed], components: [buttons] });
        return;
      }

      case 'setClose': {
        const yesId = `scrimCancelConfirm:${messageId}:${ownerId}`;
        const noId  = `cancelAbort`;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(yesId).setLabel('예, 삭제합니다').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(noId).setLabel('아니오').setStyle(ButtonStyle.Secondary),
        );

        return interaction.reply({
          content: '⚠️ 정말 취소하시겠습니까? 이 글은 **삭제**됩니다.',
          components: [row],
          flags: 64,
        });
      }

      // ✅ 신청하기
      case 'applyScrim': {

        if (ownerId === applicantUserId) {
          return interaction.reply({ content: '❌ 자기 글에는 신청할 수 없습니다.', flags: 64 });
        }

        const guestScrims = scrimStore.findByOwner(applicantUserId) || [];
        if (guestScrims.length === 0) {
          return interaction.reply({ content: '⚠️ 등록된 스크림이 있어야 신청할 수 있습니다.', flags: 64 });
        }

        // ── 스크림 2개 이상: 지금은 신청하지 말고 "선택 UI"만 띄움
        if (guestScrims.length > 1) {
          const select = new StringSelectMenuBuilder()
            .setCustomId(`selectOwnScrim:${messageId}:${ownerId}`) // ownerScrimMsgId:ownerId
            .setPlaceholder('신청에 사용할 내 스크림을 선택하세요')
            .addOptions(
              guestScrims.map((sc) => ({
                label: sc.title,
                value: sc.messageId,              // guestScrimId
                description: sc.time || '시간 미정',
              }))
            );

          return interaction.reply({
            content: '신청에 사용할 스크림을 골라주세요!',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: 64,
          });
        }

        // ── 스크림 1개: 여기서 "한 번만" 신청 처리 + DM 전송
        const guestScrim = guestScrims[0];

        const applyRes = scrimStore.apply(messageId, applicantUserId);
        if (!applyRes.ok) {
          const msg =
            applyRes.reason === 'OWNER' ? '호스트는 신청할 수 없습니다.' :
            applyRes.reason === 'STATE' ? '지금은 신청할 수 없는 상태예요.' :
            applyRes.reason === 'DUPLICATE' ? '이미 신청한 스크림입니다.' :
            '신청 처리 중 문제가 발생했어요.';
          return interaction.reply({ content: `❌ ${msg}`, flags: 64 });
        }

        // 호스트 모집글 임베드 갱신(신청자 수 반영)
        const updatedScrim = applyRes.scrim;
        const updatedEmbed = buildScrimEmbed({
          title: updatedScrim.title,
          clan: updatedScrim.clan,
          players: updatedScrim.players,
          time: updatedScrim.time,
          etc: updatedScrim.etc,
          status: updatedScrim.status,
          author: updatedScrim.author,
          appliedByCount: updatedScrim.getApplicantCount() || 0,
        });
        const buttons = createButtons(ownerId, true);
        await interaction.message.edit({ embeds: [updatedEmbed], components: [buttons] });

        // DM 전송 (hostScrimId, guestScrimId 포함)
        const ownerUser = await interaction.client.users.fetch(ownerId).catch(() => null);
        try {
          if (!ownerUser) {
            return interaction.reply({ content: '⚠️ 호스트를 찾을 수 없습니다.', flags: 64 });
          }

          const dmEmbed = buildScrimEmbed({
            title: guestScrim.title,
            clan: guestScrim.clan,
            players: guestScrim.players,
            time: guestScrim.time,
            etc: guestScrim.etc,
            status: guestScrim.status,
            author: guestScrim.author, // 신청자
          });

          const channelMention = guestScrim.channelId ? `<#${guestScrim.channelId}>` : '(채널 정보 없음)';
          const messageLink =
            (guestScrim.guildId && guestScrim.channelId && guestScrim.messageId)
              ? `https://discord.com/channels/${guestScrim.guildId}/${guestScrim.channelId}/${guestScrim.messageId}`
              : null;

          const customId = `scrimConfirm:${messageId}:${guestScrim.messageId}`; // ownerScrimId:guestScrimId

          await ownerUser.send({
            content: [
              `📬 <@${applicantUserId}>님이 스크림을 신청했습니다!`,
              `• 채널: ${channelMention}`,
              messageLink ? `• 🔗 ${messageLink}` : null,
            ].filter(Boolean).join('\n'),
            embeds: [dmEmbed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(customId) 
                  .setLabel('✅ 수락 및 대화채널 생성')
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
          });

          return interaction.reply({ content: '📨 신청 요청을 보냈습니다!', flags: 64 });
        } catch (err) {
          console.error('DM 전송 실패:', err);
          // DM 실패: 상대가 DM 차단/서버 DM 비허용일 가능성 높음
          return interaction.reply({
            content: '⚠️ 상대방에게 DM을 보낼 수 없습니다. (상대의 DM 설정을 확인해주세요)',
            flags: 64,
          });
        }
      }

      default:
        return interaction.reply({ content: '❌ 알 수 없는 동작입니다.', flags: 64 });
    }
  } catch (err) {
    console.error('스크림 버튼 처리 중 오류:', err);
    return interaction.reply({ content: `⚠️ 처리 중 오류: ${err.message}`, flags: 64 });
  }
};
