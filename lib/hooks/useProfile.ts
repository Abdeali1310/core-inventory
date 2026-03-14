'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useProfile() {
    const [role, setRole] = useState<'manager' | 'staff' | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
                .then(({ data }) => setRole(data?.role ?? 'staff'));
        });
    }, []);

    return { role, isManager: role === 'manager', isStaff: role === 'staff' };
}