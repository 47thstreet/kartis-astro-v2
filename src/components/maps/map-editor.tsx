'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { useToast } from '@/components/ui/toast-provider';

type Zone = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type Table = {
  id: string;
  x: number;
  y: number;
  number: string;
  status: string;
};

export default function MapEditor({ layoutId, zones, tables }: { layoutId: string; zones: Zone[]; tables: Table[] }) {
  const [items, setItems] = useState({ zones, tables });
  const [saving, setSaving] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 900, height: 540 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    const update = () => {
      const width = Math.min(containerRef.current?.clientWidth ?? 900, 900);
      setStageSize({ width, height: Math.round(width * 0.6) });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/map/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId, zones: items.zones, tables: items.tables })
      });

      if (!response.ok) throw new Error('Save failed');

      pushToast({ title: 'Layout saved', message: 'Map updates are live.', tone: 'success' });
    } catch {
      pushToast({ title: 'Could not save map', message: 'Please retry in a moment.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-3'>
      <p className='text-sm text-white/70'>Modes: Scan / Existing / Manual / AI-Draft (heuristic).</p>
      <div ref={containerRef} className='overflow-hidden rounded-xl border border-white/10 bg-black/20'>
        <Stage width={stageSize.width} height={stageSize.height} className='touch-pan-x touch-pan-y'>
          <Layer>
            {items.zones.map(zone => (
              <Rect
                key={zone.id}
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={`${zone.color}66`}
                stroke={zone.color}
                draggable
                onDragEnd={e =>
                  setItems(v => ({
                    ...v,
                    zones: v.zones.map(current =>
                      current.id === zone.id ? { ...current, x: e.target.x(), y: e.target.y() } : current
                    )
                  }))
                }
              />
            ))}
            {items.tables.map(table => (
              <Fragment key={table.id}>
                <Circle
                  x={table.x}
                  y={table.y}
                  radius={16}
                  fill={table.status === 'AVAILABLE' ? '#22c55e' : '#f59e0b'}
                  draggable
                  onDragEnd={e =>
                    setItems(v => ({
                      ...v,
                      tables: v.tables.map(current =>
                        current.id === table.id ? { ...current, x: e.target.x(), y: e.target.y() } : current
                      )
                    }))
                  }
                />
                <Text x={table.x - 10} y={table.y - 6} text={table.number} fontSize={10} fill='#fff' />
              </Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
      <button
        className='inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-4 font-medium text-white disabled:opacity-60'
        onClick={() => void save()}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save Layout'}
      </button>
    </div>
  );
}
