import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  order_index: number;
}

export function useUsefulLinks() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('useful_links')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error('Error fetching useful links:', err);
      setError('Failed to load useful links');
    } finally {
      setLoading(false);
    }
  };

  const addLink = async (link: Omit<UsefulLink, 'id' | 'order_index'>) => {
    try {
      const { data, error } = await supabase
        .from('useful_links')
        .insert([{ 
          ...link, 
          order_index: links.length 
        }])
        .select()
        .single();

      if (error) throw error;
      setLinks([...links, data]);
      return data;
    } catch (err) {
      console.error('Error adding useful link:', err);
      throw err;
    }
  };

  const updateLink = async (id: string, link: Partial<UsefulLink>) => {
    try {
      const { data, error } = await supabase
        .from('useful_links')
        .update(link)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setLinks(links.map(l => l.id === id ? data : l));
      return data;
    } catch (err) {
      console.error('Error updating useful link:', err);
      throw err;
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('useful_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(links.filter(l => l.id !== id));
    } catch (err) {
      console.error('Error deleting useful link:', err);
      throw err;
    }
  };

  const reorderLinks = async (reorderedLinks: UsefulLink[]) => {
    try {
      // Update local state immediately for better UX
      setLinks(reorderedLinks);

      // Prepare updates with all required fields
      const updates = reorderedLinks.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        order_index: link.order_index
      }));

      const { error } = await supabase
        .from('useful_links')
        .upsert(updates, {
          onConflict: 'id'
        });

      if (error) {
        // Revert local state if update fails
        await fetchLinks();
        throw error;
      }
    } catch (err) {
      console.error('Error reordering links:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return {
    links,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    refresh: fetchLinks
  };
}