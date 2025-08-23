/**
 * Enum to define mandala types in the worldbuilding system
 * 
 * - CHARACTER: A mandala that represents a specific character and is linked 
 *              to a parent mandala (i.e., it's a character within another mandala)
 * - UNIFIED: An independent mandala that can contain characters but is not 
 *            itself a character of another mandala
 */
export enum MandalaType {
  CHARACTER = 'character',
  UNIFIED = 'unified',
}
