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

/**
 * @description 스크림 모집 버튼 인터랙션 핸들러 (setOpen / setClose / applyScrim)
 */
module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  // customId 규칙: `${action}:${ownerId}`
  const [action, ownerId] = String(interaction.customId).split(':');
  const message = interaction.message;
  const messageId = message.id;

  // 공통: 스크림/임베드 확보
  const scrim = scrimStore.get(messageId);
  const embed = message.embeds?.[0];
  const ownerUser = await interaction.client.users.fetch(ownerId).catch(() => null);

  if (!embed || !scrim) {
    return interaction.reply({ content: '❌ 유효하지 않은 모집글입니다.', flags: 64 });
  }

  // 작성자 전용 액션 보호
  const isOwnerAction = action === 'setOpen' || action === 'setClose';
  if (isOwnerAction && interaction.user.id !== ownerId) {
    return interaction.reply({ content: '❌ 이 버튼은 모집글 작성자만 사용할 수 있습니다.', flags: 64 });
  }

  try {
    switch (action) {
      case 'setOpen': {
        // 상태 전이: WAIT -> OPEN (스토어가 규칙/이벤트/로그 처리)
        const res = scrimStore.updateStatus(messageId, Scrim.Status.OPEN, interaction.user.id);
        if (!res.ok) return interaction.reply({ content: res.error || '상태 변경 실패', flags: 64 });

        // 역할 부여(선택)
        const role = interaction.guild.roles.cache.find((r) => r.name === '스크림모집중');
        if (role) {
          const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
          if (member && !member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(() => null);
          }
        }

        // 임베드/버튼 갱신
        const timeStr = getFormatTimestamp();
        const newStatusText = `${Scrim.Status.OPEN}(${timeStr})`;
        const updatedEmbed = updateEmbedDesc(embed, newStatusText);
        const buttons = createButtons(ownerId, true);

        await interaction.update({ embeds: [updatedEmbed], components: [buttons] });
        return;
      }

      case 'setClose': {
        try {
          await interaction.message.delete();
        } catch (e) {
          console.error(e);
        }
        scrimStore.delete(messageId);

        const role = interaction.guild.roles.cache.find(r => r.name === '스크림모집중');
        if (role) {
          try {
            const ownerMember = await interaction.guild.members.fetch(ownerId);
            const hasOtherOpen = scrimStore.findByOwner(ownerId).some(x => x.status === Scrim.Status.OPEN);
            if (!hasOtherOpen && ownerMember.roles.cache.has(role.id)) {
              await ownerMember.roles.remove(role).catch(() => null);
            }
          } catch {}
        }
        return interaction.reply({ content: '🗑️ 삭제 완료', flags: 64 });
      }

      case 'applyScrim': {
        const requesterId = interaction.user.id;

        // 자기 글 신청 방지
        if (ownerId === requesterId) {
          return interaction.reply({ content: '❌ 자기 글에는 신청할 수 없습니다.', flags: 64 });
        }

        // 신청자 본인의 스크림 1개 이상 필요
        const myScrims = scrimStore.findByOwner(requesterId) || [];
        if (myScrims.length === 0) {
          return interaction.reply({ content: '⚠️ 등록된 스크림이 있어야 신청할 수 있습니다.', ephemeral: 64 });
        }

        // 중복/상태 체크 먼저 (실패하면 DM 안 보냄)
        const applyRes = scrimStore.apply(messageId, requesterId);
        if (!applyRes.ok) {
          const msg =
            applyRes.reason === 'OWNER' ? '호스트는 신청할 수 없습니다.' :
            applyRes.reason === 'STATE' ? '지금은 신청할 수 없는 상태예요.' :
            applyRes.reason === 'DUPLICATE' ? '이미 신청한 스크림입니다.' :
            '신청 처리 중 문제가 발생했어요.';
          return interaction.reply({ content: `❌ ${msg}`, ephemeral: 64 });
        }

        // 스크림 임베드 갱신(신청자 수 반영)
        const updatedScrim = applyRes.scrim;
        const updatedEmbed = buildScrimEmbed({
          title: updatedScrim.title,
          clan: updatedScrim.clan,
          players: updatedScrim.players,
          time: updatedScrim.time,
          etc: updatedScrim.etc,
          status: '✅ 모집 중',
          author: updatedScrim.owner,
          appliedCount: updatedScrim.appliedBy?.length || 0,
        });
        const buttons = createButtons(ownerId, true);
        await interaction.message.edit({ embeds: [updatedEmbed], components: [buttons] });

        // 내 스크림이 2개 이상이면 선택 메뉴로 고르게 하기
        if (myScrims.length > 1) {
          const select = new StringSelectMenuBuilder()
            .setCustomId(`selectOwnScrim:${messageId}:${ownerId}`) // 이후 핸들러에서 파싱
            .setPlaceholder('신청에 사용할 내 스크림을 선택하세요')
            .addOptions(
              myScrims.map((sc) => ({
                label: sc.title,
                value: sc.messageId,
                description: sc.time || '시간 미정',
              }))
            );

          return interaction.reply({
            content: '신청에 사용할 스크림을 골라주세요!',
            components: [new ActionRowBuilder().addComponents(select)],
            flags: 64,
          });
        }

        // 내 스크림이 1개뿐이면 그걸로 DM 전송
        const applyScrim = myScrims[0];
        if (!ownerUser) {
          return interaction.reply({ content: '⚠️ 호스트를 찾을 수 없습니다.', flags: 64 });
        }

        try {
          const dmEmbed = buildScrimEmbed({
            title: applyScrim.title,
            clan: applyScrim.clan,
            players: applyScrim.players,
            time: applyScrim.time,
            etc: applyScrim.etc,
            status: applyScrim.status,
            author: applyScrim.owner,
          });

          // 안전하게 링크/멘션 구성
          const channelMention = applyScrim.channelId ? `<#${applyScrim.channelId}>` : '(채널 정보 없음)';
          const messageLink =
            (applyScrim.guildId && applyScrim.channelId && applyScrim.messageId)
              ? `https://discord.com/channels/${applyScrim.guildId}/${applyScrim.channelId}/${applyScrim.messageId}`
              : null;

          const customId = `confirmScrim:${requesterId}:${interaction.guildId}`;
          await ownerUser.send({
            content: [
              `📬 <@${requesterId}>님이 스크림으로 신청했습니다!`,
              `• 채널: ${channelMention}`,
              messageLink ? `• 🔗 메시지 링크: ${messageLink}` : null,
            ].filter(Boolean).join('\n'),
            embeds: [dmEmbed],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(customId)
                  .setLabel('✅ 대화채널 생성')
                  .setStyle(ButtonStyle.Primary)
              ),
            ],
          });

          return interaction.reply({ content: '📨 신청 요청을 보냈습니다!', flags: 64 });
        } catch (err) {
          return interaction.reply({ content: '⚠️ 상대방에게 DM을 보낼 수 없습니다.', flags: 64 });
        }
      }

      default:
        return interaction.reply({ content: '❌ 알 수 없는 동작입니다.', flags: 64 });
    }
  } catch (err) {
    // 예상치 못한 예외 안전 처리
    return interaction.reply({ content: `⚠️ 처리 중 오류: ${err.message}`, flags: 64 });
  }
};
