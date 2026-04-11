import { STRUCTURE_LABELS } from '@/config/constants';
import type { BottomStructure } from '@/types/domain';

interface SubstrateAdvice {
  title: string;
  tactileCue: string;
  rig: string;
  feeding: string;
}

export const SUBSTRATE_ADVICE: Record<BottomStructure, SubstrateAdvice> = {
  gravel: {
    title: STRUCTURE_LABELS.gravel,
    tactileCue: 'Чіткі “тук-тук” у бланк, вантаж стрибає по камінню.',
    rig: 'Добре працюють донні монтажі. На запресованих водоймах перевір краї плями.',
    feeding: 'Тримай прикормку компактно: це часто точка-стіл.'
  },
  mud: {
    title: STRUCTURE_LABELS.mud,
    tactileCue: 'Плавний вʼязкий опір, вантаж може “залипати” при старті.',
    rig: 'Helicopter, Chod або довший повідець, щоб насадка не пішла в мул.',
    feeding: 'Перевір запах і щільність: хороший мул часто тримає мотиля.'
  },
  clay: {
    title: STRUCTURE_LABELS.clay,
    tactileCue: 'Дуже рівне ковзання, інколи майже без вібрацій.',
    rig: 'Чиста презентація для більшості донних монтажів.',
    feeding: 'Шукай краї глини біля брівок: там часто природні “тарілки”.'
  },
  sand: {
    title: STRUCTURE_LABELS.sand,
    tactileCue: 'Рівне ковзання з легкими мікропоштовхами.',
    rig: 'Підходить для класичних донних презентацій і wafters.',
    feeding: 'Добре для точного споду, але перевір поруч перехід у мул або гравій.'
  },
  weed: {
    title: STRUCTURE_LABELS.weed,
    tactileCue: 'Пружний опір, вершинка згинається як гумка.',
    rig: 'Chod, solid PVA або drop-off lead. Шукай чисті вікна серед трави.',
    feeding: 'Трава тримає корм і безпеку, але презентація має лежати чисто.'
  }
};
