import { Layer, Line, Text } from "react-konva";

interface RulersProps {
  width: number;
  height: number;
  visible: boolean;
}

export const Rulers = ({ width, height, visible }: RulersProps) => {
  if (!visible) return null;

  const rulerSize = 30;
  const majorTick = 50;
  const minorTick = 10;

  const horizontalTicks = [];
  const verticalTicks = [];

  // Régua horizontal (superior)
  for (let i = 0; i <= width; i += minorTick) {
    const isMajor = i % majorTick === 0;
    horizontalTicks.push(
      <Line
        key={`h-${i}`}
        points={[i, rulerSize, i, isMajor ? rulerSize - 10 : rulerSize - 5]}
        stroke="#666"
        strokeWidth={isMajor ? 1.5 : 0.5}
      />
    );
    if (isMajor && i > 0) {
      horizontalTicks.push(
        <Text
          key={`ht-${i}`}
          x={i - 10}
          y={5}
          text={i.toString()}
          fontSize={10}
          fill="#666"
        />
      );
    }
  }

  // Régua vertical (lateral)
  for (let i = 0; i <= height; i += minorTick) {
    const isMajor = i % majorTick === 0;
    verticalTicks.push(
      <Line
        key={`v-${i}`}
        points={[rulerSize, i, isMajor ? rulerSize - 10 : rulerSize - 5, i]}
        stroke="#666"
        strokeWidth={isMajor ? 1.5 : 0.5}
      />
    );
    if (isMajor && i > 0) {
      verticalTicks.push(
        <Text
          key={`vt-${i}`}
          x={2}
          y={i - 8}
          text={i.toString()}
          fontSize={10}
          fill="#666"
          rotation={0}
        />
      );
    }
  }

  return (
    <Layer>
      {/* Fundo da régua horizontal */}
      <Line
        points={[0, 0, width, 0, width, rulerSize, 0, rulerSize]}
        fill="#f0f0f0"
        closed
      />
      {/* Fundo da régua vertical */}
      <Line
        points={[0, 0, rulerSize, 0, rulerSize, height, 0, height]}
        fill="#f0f0f0"
        closed
      />
      {/* Cantos */}
      <Line
        points={[0, 0, rulerSize, 0, rulerSize, rulerSize, 0, rulerSize]}
        fill="#e0e0e0"
        closed
      />
      {/* Ticks */}
      {horizontalTicks}
      {verticalTicks}
    </Layer>
  );
};
