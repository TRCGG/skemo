

/**
 * 
 * @desc 취소 중단 버튼 핸들러
 */

module.exports = async (interaction) => {

  if(!interaction.isButton()) return;
  return interaction.update({ content: '취소를 중단했습니다.', components:[], flags: 64 });
}