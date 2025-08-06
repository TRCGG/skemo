// src/interactions/dmConfirm.js
const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");

const { setChannel, hasChannel } = require("../utils/scrimChannelStore");

/**
 * @description DM 채널 생성 및 스크림 요청 확인 버튼 핸들러
 */

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, requesterId, guildId] = interaction.customId.split(":");
  if (action !== "confirmScrim") return;

  let guild;
  try {
    guild = await interaction.client.guilds.fetch(guildId);
  } catch (err) {
    console.error("❌ guild fetch 실패:", err);
    return interaction.reply({
      content: "❌ 서버 정보를 불러올 수 없습니다.",
      ephemeral: true,
    });
  }
  const ownerId = interaction.user.id;

  Promise.all([guild.members.fetch(requesterId), guild.members.fetch(ownerId)])
    .then(([requester, owner]) => {
      const existingChannelId = hasChannel(owner.id, requester.id);
      if (existingChannelId) {
        return interaction.update({
          content: `이미 대화 채널이 있어요: <#${existingChannelId}>`,
          components: [
            new ActionRowBuilder().addComponents(
              ButtonBuilder.from(interaction.component).setDisabled(true)
            ),
          ],
        });
      }

      return guild.channels
        .create({
          name: `스크림-${owner.user.displayName}-${requester.user.displayName}`.toLowerCase(),
          type: ChannelType.GuildText,
          parent: "1389140189674340462",
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: requester.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: owner.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        })
        .then((channel) => {
          setChannel(owner.id, requester.id, channel.id);

          // 채널 삭제 예약 (72시간 후)
          setTimeout(() => {
            channel.delete("자동 만료된 스크림 대화 채널").catch(console.error);
          }, 1000 * 60 * 60 * 72); // 72시간

          // ✅ 채널에 안내 메시지 전송
          channel.send("🙌 **72시간 후 채널은 자동 삭제됩니다, 상호 존중하며 대화를 나눠주세요!**");

          // 상호간 DM 발송
          requester
            .send({
              content: `📢 <@${owner.id}>님과의 스크림 대화 채널이 생성되었습니다: <#${channel.id}>`,
            })
            .catch(() =>
              console.warn(`❌ requester (${requester.id})에게 DM 전송 실패`)
            );

          return interaction.update({
            content: `✅ 대화 채널 생성 완료: <#${channel.id}> 72시간 후 채널은 자동 삭제됩니다.`,
            components: [],
          });
        });
    })
    .catch((err) => {
      console.error("❌ DM 채널 생성 오류:", err);
      interaction
        .reply({
          content: "❌ 채널 생성 중 오류가 발생했습니다.",
          flags: 64,
        })
        .catch(console.error);
    });
};
