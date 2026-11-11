import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Employee } from '../data/employee'
import EmployeeCard from './EmployeeCard'
import './EmployeeCarousel.css'

interface EmployeeCarouselProps {
  employees: Employee[]
  selectedEmployeeId: string
  onSelectedEmployeeIdChange: (employeeId: string) => void
  onViewProfile: (employee: Employee) => void
}

const DRAG_THRESHOLD_PX = 8
const DEGREES_PER_PIXEL = 0.42

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function wrapIndex(value: number, total: number) {
  return ((value % total) + total) % total
}

function indexFromRotation(rotation: number, total: number) {
  if (total === 0) return 0
  const step = 360 / total
  return wrapIndex(Math.round(-rotation / step), total)
}

function EmployeeCarousel({
  employees,
  selectedEmployeeId,
  onSelectedEmployeeIdChange,
  onViewProfile,
}: EmployeeCarouselProps) {
  const total = employees.length
  const step = total > 0 ? 360 / total : 0
  const labelId = useId()
  const isSingleResult = total === 1
  const canNavigate = total > 1

  const initialIndex = Math.max(
    0,
    employees.findIndex((employee) => employee.id === selectedEmployeeId),
  )
  const initialRotation = isSingleResult ? 0 : -initialIndex * step

  const stageRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(initialRotation)
  const velocityRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const wheelSnapTimerRef = useRef<number | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    lastX: number
    lastTime: number
    moved: boolean
    active: boolean
  } | null>(null)

  const [rotation, setRotation] = useState(initialRotation)
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [radius, setRadius] = useState(320)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const [isIsolated, setIsIsolated] = useState(isSingleResult)

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    velocityRef.current = 0
  }, [])

  const applyRotation = useCallback(
    (nextRotation: number) => {
      rotationRef.current = nextRotation
      setRotation(nextRotation)
      const nextIndex = indexFromRotation(nextRotation, total)
      setSelectedIndex(nextIndex)
      const nextId = employees[nextIndex]?.id
      if (nextId) {
        onSelectedEmployeeIdChange(nextId)
      }
    },
    [employees, onSelectedEmployeeIdChange, total],
  )

  const snapToNearest = useCallback(() => {
    if (total === 0) return

    const nearest = Math.round(-rotationRef.current / step)
    const target = -nearest * step

    if (prefersReducedMotion()) {
      setIsSnapping(false)
      applyRotation(target)
      return
    }

    setIsSnapping(true)

    const start = rotationRef.current
    const delta = target - start
    const duration = 320
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - (1 - progress) ** 3
      applyRotation(start + delta * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
        setIsSnapping(false)
        applyRotation(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [applyRotation, step, total])

  const startInertia = useCallback(() => {
    if (prefersReducedMotion() || Math.abs(velocityRef.current) < 0.08) {
      snapToNearest()
      return
    }

    setIsSnapping(false)

    const tick = () => {
      velocityRef.current *= 0.94
      applyRotation(rotationRef.current + velocityRef.current)

      if (Math.abs(velocityRef.current) >= 0.08) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
        snapToNearest()
      }
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [applyRotation, snapToNearest])

  const rotateBySteps = useCallback(
    (steps: number) => {
      if (!canNavigate) return
      cancelAnimation()
      const current = Math.round(-rotationRef.current / step)
      const target = -(current + steps) * step

      if (prefersReducedMotion()) {
        applyRotation(target)
        return
      }

      setIsSnapping(true)
      const start = rotationRef.current
      const delta = target - start
      const duration = 280
      const startTime = performance.now()

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration)
        const eased = 1 - (1 - progress) ** 3
        applyRotation(start + delta * eased)

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          frameRef.current = null
          setIsSnapping(false)
          applyRotation(target)
        }
      }

      frameRef.current = requestAnimationFrame(tick)
    },
    [applyRotation, canNavigate, cancelAnimation, step],
  )

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateRadius = () => {
      const cardWidth = Math.min(320, stage.clientWidth * 0.72)
      const nextRadius = isSingleResult
        ? 0
        : Math.max(
            220,
            cardWidth / (2 * Math.tan(Math.PI / Math.max(total, 3))),
          )
      setRadius(nextRadius)
    }

    updateRadius()

    const observer = new ResizeObserver(updateRadius)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [isSingleResult, total])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !canNavigate || isIsolated) return

    const onWheel = (event: WheelEvent) => {
      const dominant =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY

      if (dominant === 0) return

      event.preventDefault()
      cancelAnimation()
      setIsSnapping(false)
      applyRotation(rotationRef.current + dominant * 0.18)

      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current)
      }

      wheelSnapTimerRef.current = window.setTimeout(() => {
        wheelSnapTimerRef.current = null
        snapToNearest()
      }, 120)
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      stage.removeEventListener('wheel', onWheel)
      if (wheelSnapTimerRef.current !== null) {
        window.clearTimeout(wheelSnapTimerRef.current)
      }
    }
  }, [applyRotation, canNavigate, cancelAnimation, isIsolated, snapToNearest])

  useEffect(() => () => cancelAnimation(), [cancelAnimation])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canNavigate || isIsolated) return

    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select')) return
    if (target.closest('.employee-card-scene')) return

    cancelAnimation()
    setIsSnapping(false)
    setIsDragging(false)

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      moved: false,
      active: true,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canNavigate) return

    const drag = dragRef.current
    if (!drag?.active || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.lastX
    const totalDelta = event.clientX - drag.startX

    if (!drag.moved && Math.abs(totalDelta) >= DRAG_THRESHOLD_PX) {
      drag.moved = true
      setIsDragging(true)
    }

    if (!drag.moved) return

    event.preventDefault()

    const now = performance.now()
    const elapsed = Math.max(now - drag.lastTime, 1)
    velocityRef.current = (deltaX / elapsed) * 16 * DEGREES_PER_PIXEL

    applyRotation(rotationRef.current + deltaX * DEGREES_PER_PIXEL)

    drag.lastX = event.clientX
    drag.lastTime = now
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag?.active || drag.pointerId !== event.pointerId) return

    drag.active = false
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (canNavigate && drag.moved) {
      startInertia()
    } else if (canNavigate) {
      snapToNearest()
    }

    dragRef.current = null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select')) return

    if (event.key === 'Escape' && isIsolated && !isSingleResult) {
      event.preventDefault()
      setIsIsolated(false)
      return
    }

    if (!canNavigate || isIsolated) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      rotateBySteps(-1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      rotateBySteps(1)
    }
  }

  const isolateSelected = () => {
    cancelAnimation()
    setIsIsolated(true)
  }

  const exitIsolate = () => {
    if (isSingleResult) return
    setIsIsolated(false)
  }

  if (total === 0) {
    return null
  }

  const selectedEmployee = employees[selectedIndex] ?? employees[0]

  const showAsIsolated = isIsolated || isSingleResult

  return (
    <section
      className={[
        'employee-carousel',
        isSingleResult ? 'employee-carousel--single' : '',
        showAsIsolated ? 'employee-carousel--isolated' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-roledescription="carousel"
      aria-labelledby={labelId}
    >
      <p className="employee-carousel__hint">
        {showAsIsolated
          ? 'Click the card to flip for more info'
          : 'Drag to spin · click a card to isolate it'}
      </p>

      <div
        ref={stageRef}
        className={[
          'employee-carousel__stage',
          isDragging ? 'is-dragging' : '',
          isSnapping ? 'is-snapping' : '',
          isSingleResult ? 'is-single' : '',
          showAsIsolated ? 'is-isolated' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        tabIndex={canNavigate && !showAsIsolated ? 0 : -1}
        role="group"
        aria-label={
          showAsIsolated
            ? `${selectedEmployee.name} isolated employee card`
            : 'Employee coat rack. Drag to rotate, or use left and right arrow keys.'
        }
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="employee-carousel__ring"
          style={{
            transform: showAsIsolated ? 'none' : `rotateY(${rotation}deg)`,
          }}
        >
          {employees.map((employee, index) => {
            const angle = index * step
            const isSelected = index === selectedIndex

            return (
              <div
                key={employee.id}
                className={[
                  'employee-carousel__item',
                  isSelected ? 'is-selected' : '',
                  showAsIsolated && !isSelected ? 'is-hidden' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  transform: showAsIsolated
                    ? isSelected
                      ? 'translate(-50%, -50%) scale(1.06)'
                      : `rotateY(${angle}deg) translateZ(${radius}px)`
                    : `rotateY(${angle}deg) translateZ(${radius}px)`,
                }}
                aria-current={isSelected ? 'true' : undefined}
                aria-hidden={showAsIsolated && !isSelected ? true : undefined}
              >
                <EmployeeCard
                  employee={employee}
                  isSelected={isSelected}
                  isIsolated={showAsIsolated && isSelected}
                  onIsolate={isolateSelected}
                  onExitIsolate={isSingleResult ? undefined : exitIsolate}
                  onViewProfile={onViewProfile}
                />
              </div>
            )
          })}
        </div>
      </div>

      {!showAsIsolated || isSingleResult ? (
        <p id={labelId} className="employee-carousel__counter" aria-live="polite">
          <span>
            {selectedIndex + 1} of {total}
          </span>
          <span className="visually-hidden">{`, ${selectedEmployee.name}`}</span>
        </p>
      ) : (
        <p id={labelId} className="employee-carousel__counter" aria-live="polite">
          Viewing {selectedEmployee.name}
        </p>
      )}
    </section>
  )
}

export default EmployeeCarousel
