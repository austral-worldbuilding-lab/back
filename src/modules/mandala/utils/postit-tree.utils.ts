import { PostitWithCoordinates } from '../types/postits';

export function addPostitToParent(
  postits: PostitWithCoordinates[], 
  parentId: string, 
  newPostit: PostitWithCoordinates
): { found: boolean; postits: PostitWithCoordinates[] } {
  for (let i = 0; i < postits.length; i++) {
    const postit = postits[i];
    
    if (postit.id === parentId) {
      const updatedPostits = [...postits];
      updatedPostits[i] = {
        ...postit,
        childrens: [...postit.childrens, newPostit]
      };
      return { found: true, postits: updatedPostits };
    }
    
    const childResult = addPostitToParent(postit.childrens, parentId, newPostit);
    if (childResult.found) {
      const updatedPostits = [...postits];
      updatedPostits[i] = {
        ...postit,
        childrens: childResult.postits
      };
      return { found: true, postits: updatedPostits };
    }
  }
  
  return { found: false, postits };
}

export function deletePostitFromTree(
  postits: PostitWithCoordinates[], 
  postitId: string
): { found: boolean; postits: PostitWithCoordinates[] } {
  const originalLength = postits.length;
  const filteredPostits = postits.filter(p => p.id !== postitId);
  
  if (filteredPostits.length < originalLength) {
    return { found: true, postits: filteredPostits };
  }
  
  for (let i = 0; i < postits.length; i++) {
    const postit = postits[i];
    const childResult = deletePostitFromTree(postit.childrens, postitId);
    
    if (childResult.found) {
      const updatedPostits = [...postits];
      updatedPostits[i] = {
        ...postit,
        childrens: childResult.postits
      };
      return { found: true, postits: updatedPostits };
    }
  }
  
  return { found: false, postits };
}
