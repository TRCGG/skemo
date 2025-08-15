// src/commands/scrimRegister.js
const { SlashCommandBuilder } = require('discord.js');
const { buildScrimEmbed, createButtons } = require('../utils/scrimButtonEmbed');
const scrimStore = require('../stores/scrimStore');
const Scrim = require('../model/scrim');
const logger = require('../utils/logger');
const { bus, EVENTS } = require('../utils/eventBus');

const clamp = (s, n) => String(s ?? '').trim().slice(0, n);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('스크림등록')
    .setDescription('스크림 등록 글을 생성합니다.')
    .addStringOption(o => o.setName('title').setDescription('제목').setRequired(true))
    .addStringOption(o => o.setName('clan').setDescription('소속 클랜명').setRequired(true))
    .addStringOption(o => o.setName('nick1').setDescription('탑_닉네임#태그 1').setRequired(true))
    .addStringOption(o => o.setName('nowtier1').setDescription('탑_현재_티어_1').setRequired(true))
    .addStringOption(o => o.setName('prevtier1').setDescription('탑_이전_최고 티어_1').setRequired(true))
    .addStringOption(o => o.setName('nick2').setDescription('정글_닉네임#태그 2').setRequired(true))
    .addStringOption(o => o.setName('nowtier2').setDescription('정글_현재_티어_2').setRequired(true))
    .addStringOption(o => o.setName('prevtier2').setDescription('정글_이전_최고 티어_2').setRequired(true))
    .addStringOption(o => o.setName('nick3').setDescription('미드_닉네임#태그 3').setRequired(true))
    .addStringOption(o => o.setName('nowtier3').setDescription('미드_현재_티어_3').setRequired(true))
    .addStringOption(o => o.setName('prevtier3').setDescription('미드_이전_최고_티어_3').setRequired(true))
    .addStringOption(o => o.setName('nick4').setDescription('원딜_닉네임#태그 4').setRequired(true))
    .addStringOption(o => o.setName('nowtier4').setDescription('원딜_현재_티어_4').setRequired(true))
    .addStringOption(o => o.setName('prevtier4').setDescription('원딜_이전_최고_티어_4').setRequired(true))
    .addStringOption(o => o.setName('nick5').setDescription('서폿_닉네임#태그5').setRequired(true))
    .addStringOption(o => o.setName('nowtier5').setDescription('서폿_현재_티어_5').setRequired(true))
    .addStringOption(o => o.setName('prevtier5').setDescription('서폿_이전_최고 티어_5').setRequired(true))
    .addStringOption(o => o.setName('time').setDescription('가능 시간대').setRequired(true))
    .addStringOption(o => o.setName('etc').setDescription('피리어스 여부 혹은 기타').setRequired(false)),

  async execute(interaction) {
    try {
      const ownerId = interaction.user.id;
      const guildId = interaction.guildId;
      const author = interaction.user;

      // 최대 3개 제한
      const myScrims = scrimStore.findByOwner(ownerId);
      if (myScrims.length >= 3) {
        return interaction.reply({
          content: '❌ 스크림 등록은 3개 초과하여 등록할 수 없습니다.',
          flags: 64,
        });
      }

      // 입력값 확보 + 정리
      const title = clamp(interaction.options.getString('title'), 80);
      const clan  = clamp(interaction.options.getString('clan'), 40);
      const time  = clamp(interaction.options.getString('time'), 60);
      const etc   = clamp(interaction.options.getString('etc') || '없음', 120);

      const players = [];
      for (let i = 1; i <= 5; i++) {
        players.push({
          nick:     clamp(interaction.options.getString(`nick${i}`), 40),
          nowTier:  clamp(interaction.options.getString(`nowtier${i}`), 20),
          prevTier: clamp(interaction.options.getString(`prevtier${i}`), 20),
        });
      }

      // 임베드 + 버튼
      const embed = buildScrimEmbed({
        title, clan, players, time, etc,
        status: Scrim.Status.WAIT,
        author: author,
      });
      const buttons = createButtons(ownerId, false); // setOpen / setClose / applyScrim

      const msg = await interaction.reply({
        embeds: [embed],
        components: [buttons],
        fetchReply: true,
      });

      // Scrim 모델 생성
      const scrim = new Scrim({
        messageId: msg.id,
        channelId: msg.channel.id,
        guildId,           
        ownerId,
        author,
        title,
        clan,
        players,
        time,
        etc,
        status: Scrim.Status.WAIT,
        createdAt: Date.now(),
        appliedBy: [],
      });

      // 저장 + 로깅 + 이벤트
      scrimStore.add(scrim);
      logger.info('스크림 생성', { title:`[${title}](${scrim.jumpLink})`, host: `<@${author.id}>` });
      bus.emit(EVENTS.SCRIM_CREATED, {
        guildId,
        scrimId: scrim.messageId,
        author,
        scrim,
      });

      // (선택) 사용성: 메시지 링크 알려주기
      // await interaction.followUp({ content: `✅ 등록 완료: https://discord.com/channels/${guildId}/${msg.channel.id}/${msg.id}`, ephemeral: true });

    } catch (err) {
      return interaction.reply({
        content: `❌ 등록 중 오류가 발생했습니다: ${String(err?.message || err)}`,
        flags: 64,
      }).catch(() => {});
    }
  },
};
