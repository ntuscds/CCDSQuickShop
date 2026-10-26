<script lang="ts">
	import { onMount } from 'svelte'
	import api from '$lib/api'
	import { EMAIL_SUFFIX, type AdminCoupon } from '$lib/cart'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import NumberField from '$lib/ui/NumberField.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Select from '$lib/ui/Select.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import Toggle from '$lib/ui/Toggle.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import EditorFrame from './EditorFrame.svelte'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	let coupons: AdminCoupon[] = $state([])
	let loading = $state(true)
	let error: unknown = $state()
	const load = async () => {
		loading = true
		error = undefined
		try {
			coupons = await api.admin.sales(salePeriod).coupons()
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	onMount(load)

	const requirementText = (coupon: AdminCoupon) => {
		if (!coupon.requirements || coupon.requirements.length === 0) return 'None'
		return coupon.requirements
			.map((req) => {
				switch (req.type) {
					case 'purchase_count':
						return `Buy ${req.amount}+ items`
					case 'email':
						return `Email is ${req.value}`
				}
			})
			.join(', ')
	}
	const discountText = (coupon: AdminCoupon) => {
		switch (coupon.discount.type) {
			case 'percentage':
				return `${coupon.discount.amount}% off`
		}
	}

	let editing: AdminCoupon | undefined = $state()
	let original = $state('')
	const dirty = $derived(!!editing && JSON.stringify(editing) !== original)
	const edit = (coupon: AdminCoupon) => {
		editing = $state.snapshot(coupon)
		original = JSON.stringify(editing)
		saveError = undefined
	}
	const create = () =>
		edit({
			id: null,
			enabled: false,
			public: false,
			stripe_id: '',
			stripe_desc: '',
			couponCode: '',
			requirements: [],
			discount: { type: 'percentage', amount: 0 }
		})

	let saving = $state(false)
	let saveError: unknown = $state()
	const save = async () => {
		if (!editing) return
		saving = true
		saveError = undefined
		try {
			const saved = await api.admin.sales(salePeriod).updateCoupon($state.snapshot(editing))
			const idx = coupons.findIndex((x) => x.id === saved.id)
			if (idx >= 0) coupons[idx] = saved
			else coupons = [...coupons, saved]
			addFlag({ appearance: 'success', title: 'Coupon saved', description: saved.couponCode })
			editing = undefined
		} catch (e) {
			saveError = e
		} finally {
			saving = false
		}
	}

	const addRequirement = () => {
		editing?.requirements.push({ type: 'purchase_count', amount: 1 })
	}
	const removeRequirement = (i: number) => () => {
		editing?.requirements.splice(i, 1)
	}
	// Changing the requirement type swaps the value field it needs.
	const changeRequirementType = (i: number) => () => {
		if (!editing) return
		const req = editing.requirements[i]
		editing.requirements[i] =
			req.type === 'email' ? { type: 'email', value: '' } : { type: 'purchase_count', amount: 1 }
	}
</script>

<svelte:head><title>Coupons - Admin</title></svelte:head>

{#if editing}
	<EditorFrame
		listLabel="Coupons"
		title={editing.id !== null ? editing.couponCode || 'Edit coupon' : 'New coupon'}
		{dirty}
		{saving}
		error={saveError}
		saveLabel={editing.id !== null ? 'Save coupon' : 'Create coupon'}
		onSave={save}
		onCancel={() => (editing = undefined)}
	>
		<Card title="Coupon">
			<div class="flex flex-col gap-4">
				<TextField
					label="Code"
					bind:value={editing.couponCode}
					required
					helper="What buyers type in the cart. Not case-sensitive."
					autocapitalize="characters"
					spellcheck={false}
				/>
				<TextField
					label="Description"
					bind:value={() => editing?.stripe_desc ?? '', (v) => editing && (editing.stripe_desc = v)}
					helper="Shown on the Stripe payment page and receipts."
				/>
				<NumberField
					label="Discount"
					bind:value={editing.discount.amount}
					min={0}
					max={100}
					required
					class="w-40"
				>
					{#snippet elemAfter()}<span>% off</span>{/snippet}
				</NumberField>
				<Toggle label="Active" bind:checked={editing.enabled} />
				<Toggle label="Auto-apply for eligible buyers" bind:checked={editing.public} />
				<p class="-mt-2 text-small text-ink-subtlest">
					Auto-applied coupons are added to the cart automatically when their requirements are met.
					Otherwise buyers must enter the code.
				</p>
				{#if editing.stripe_id}
					<p class="text-small text-ink-subtlest">Stripe coupon ID {editing.stripe_id}</p>
				{/if}
			</div>
		</Card>
		<Card title="Requirements" description="All requirements must be met for the coupon to apply.">
			<div class="flex flex-col gap-3">
				{#each editing.requirements as req, i}
					<div class="flex flex-wrap items-end gap-2">
						<Select
							label="Requirement"
							bind:value={req.type}
							compact
							class="w-60"
							onchange={changeRequirementType(i)}
						>
							<option value="purchase_count">Minimum items in cart</option>
							<option value="email">Specific buyer email</option>
						</Select>
						{#if req.type === 'purchase_count'}
							<NumberField
								label="Minimum items"
								bind:value={req.amount}
								min={1}
								compact
								class="w-40"
							/>
						{:else if req.type === 'email'}
							<TextField
								label="Email"
								bind:value={req.value}
								compact
								class="w-72"
								placeholder={`name${EMAIL_SUFFIX}`}
								helper={`Include ${EMAIL_SUFFIX}`}
							/>
						{/if}
						<Button
							appearance="subtle"
							iconOnly
							label="Remove requirement"
							onClick={removeRequirement(i)}
						>
							<Icon name="trash" class="size-4" />
						</Button>
					</div>
				{/each}
				<div>
					<Button spacing="compact" onClick={addRequirement}>
						{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
						Add requirement
					</Button>
				</div>
			</div>
		</Card>
	</EditorFrame>
{:else}
	<PageHeader title="Coupons" description="Discount codes for the selected sale period.">
		{#snippet actions()}
			<Button appearance="primary" onClick={create}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add coupon
			</Button>
		{/snippet}
	</PageHeader>
	<ErrorBoundary {error}>
		{#if loading}
			<div class="flex justify-center py-12"><Spinner size="large" /></div>
		{:else if coupons.length === 0}
			<EmptyState
				icon="ticket"
				title="No coupons yet"
				description="Create a discount code for this sale period."
			>
				<Button appearance="primary" onClick={create}>Add coupon</Button>
			</EmptyState>
		{:else}
			<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised">
				<table class="ds-table">
					<thead>
						<tr>
							<th scope="col">Code</th>
							<th scope="col">Discount</th>
							<th scope="col">Requirements</th>
							<th scope="col">Status</th>
							<th scope="col"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody>
						{#each coupons as coupon (coupon.id)}
							<tr>
								<td class="font-medium">{coupon.couponCode}</td>
								<td>{discountText(coupon)}</td>
								<td>{requirementText(coupon)}</td>
								<td>
									<span class="flex flex-wrap gap-1">
										{#if coupon.enabled}
											<Lozenge appearance="success">Active</Lozenge>
										{:else}
											<Lozenge>Disabled</Lozenge>
										{/if}
										{#if coupon.public}<Lozenge appearance="inprogress">Auto-apply</Lozenge>{/if}
									</span>
								</td>
								<td class="text-right">
									<Button spacing="compact" onClick={() => edit(coupon)}>Edit</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</ErrorBoundary>
{/if}
